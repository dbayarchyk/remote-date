const { RemoteDate } = require("./remote-date");

describe("RemoteDate", () => {
  afterEach(() => {
    RemoteDate.destroy();
  });

  describe("init", () => {
    it("should initialize the RemoteDate value to be able to use RemoteDate.now() later", () => {
      RemoteDate.init({ remoteDate: new Date("2024-08-05T00:00Z") });

      expect(RemoteDate.now()).toEqual(expect.any(Number));
    });
  });

  describe("now", () => {
    describe("given not initialized", () => {
      it("should throw the error when called before initializing", () => {
        expect(() => RemoteDate.now()).toThrow(
          new Error("RemoteDate is not synced yet.")
        );
      });
    });

    describe("given initialized with the default referencing monotonic time", () => {
      it("should return the correct epoch milliseconds equal to the estimated current remote date", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));

        RemoteDate.init({ remoteDate: new Date("2024-08-05T00:00Z") });

        let remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816000000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:00Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816001000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:01Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816002000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:02Z"));
      });
    });

    describe("given initialized with the custom referencing monotonic time", () => {
      it("should return the correct epoch milliseconds equal to the estimated current remote date", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));
        jest.advanceTimersByTime(10_000);

        RemoteDate.init({
          remoteDate: new Date("2024-08-05T00:00Z"),
          referencingMonotonicTime: performance.now(),
        });

        let remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816000000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:00Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816001000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:01Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816002000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:02Z"));
      });
    });
  });

  describe("initFromRemote", () => {
    describe("given the remote date fetching resolves", () => {
      it("should correctly estimate the current remote date taking network delay into account", async () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));
        jest.advanceTimersByTime(10_000);

        await RemoteDate.initFromRemote({
          fetchRemote: () => {
            // Advancing monotonic timer simulating a full sync delay of 3 seconds
            // including 2 seconds of server processing time and 1 second of network round trip delay.
            jest.advanceTimersByTime(3_000);

            return Promise.resolve({
              remoteDate: new Date("2024-08-05T00:00Z"),
              serverStartProcessingMonotonicTimeInMs: 15_000,
              serverEndProcessingMonotonicTimeInMs: 17_000,
            });
          },
        });

        let remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816000500);
        // Assuming the network latency is symmetrical.
        expect(new Date(remoteNow)).toEqual(
          new Date("2024-08-05T00:00:00.500Z")
        );

        jest.advanceTimersByTime(1_000);
        remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816001500);
        expect(new Date(remoteNow)).toEqual(
          new Date("2024-08-05T00:00:01.500Z")
        );

        jest.advanceTimersByTime(1_000);
        remoteNow = RemoteDate.now();
        expect(remoteNow).toEqual(1722816002500);
        expect(new Date(remoteNow)).toEqual(
          new Date("2024-08-05T00:00:02.500Z")
        );
      });
    });

    describe("given the remote date fetching rejects", () => {
      it("should rethrow the error", async () => {
        await expect(
          RemoteDate.initFromRemote({
            fetchRemote: () =>
              Promise.reject(new Error("Something went wrong")),
          })
        ).rejects.toThrow("Something went wrong");
      });
    });
  });

  describe("destroy", () => {
    it("should abort the abort controller signal", () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));
      const emulatedServerPingListener = jest.fn();
      RemoteDate.initFromRemote({
        fetchRemote: ({ signal }) =>
          new Promise((resolve) => {
            signal.throwIfAborted();

            const timeoutId = setTimeout(
              () => {
                emulatedServerPingListener();
                resolve({
                  remoteDate: new Date("2024-08-05T00:00Z"),
                  serverStartProcessingMonotonicTimeInMs: 15_000,
                  serverEndProcessingMonotonicTimeInMs: 17_000,
                });
              },
              5_000,
              signal
            );

            signal.addEventListener("abort", () => clearTimeout(timeoutId));
          }),
      });

      RemoteDate.destroy();

      jest.runOnlyPendingTimers();

      expect(emulatedServerPingListener).not.toHaveBeenCalled();
    });
  });
});
