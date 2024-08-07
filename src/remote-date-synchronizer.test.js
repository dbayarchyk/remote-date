import { RemoteDate } from "./remote-date";
import { RemoteDateSynchronizer } from "./remote-date-synchronizer";

describe("RemoteDateSynchronizer", () => {
  describe("syncWithRemote", () => {
    describe("given the remote date fetching resolves", () => {
      it("should correctly estimate the current remote date taking network delay into account", async () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));
        jest.advanceTimersByTime(10_000);

        const remoteDate = new RemoteDate();
        const remoteDateSynchronizer = new RemoteDateSynchronizer({
          remoteDate: remoteDate,
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

        await remoteDateSynchronizer.syncWithRemote();

        let remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816000500);
        // Assuming the network latency is symmetrical.
        expect(new Date(remoteNow)).toEqual(
          new Date("2024-08-05T00:00:00.500Z")
        );

        jest.advanceTimersByTime(1_000);
        remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816001500);
        expect(new Date(remoteNow)).toEqual(
          new Date("2024-08-05T00:00:01.500Z")
        );

        jest.advanceTimersByTime(1_000);
        remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816002500);
        expect(new Date(remoteNow)).toEqual(
          new Date("2024-08-05T00:00:02.500Z")
        );
      });
    });

    describe("given the remote date fetching rejects", () => {
      it("should rethrow the error", async () => {
        const remoteDateSynchronizer = new RemoteDateSynchronizer({
          remoteDate: new RemoteDate(),
          fetchRemote: () => Promise.reject(new Error("Something went wrong")),
        });

        await expect(remoteDateSynchronizer.syncWithRemote()).rejects.toThrow(
          "Something went wrong"
        );
      });
    });
  });

  describe("destroy", () => {
    it("should abort the abort controller signal", () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));
      const emulatedServerPingListener = jest.fn();

      const remoteDateSynchronizer = new RemoteDateSynchronizer({
        remoteDate: new RemoteDate(),
        fetchRemote: ({ signal }) =>
          new Promise((resolve) => {
            signal.throwIfAborted();

            const timeoutId = setTimeout(() => {
              emulatedServerPingListener();
              resolve({
                remoteDate: new Date("2024-08-05T00:00Z"),
                serverStartProcessingMonotonicTimeInMs: 15_000,
                serverEndProcessingMonotonicTimeInMs: 17_000,
              });
            }, 5_000);

            signal.addEventListener("abort", () => clearTimeout(timeoutId));
          }),
      });

      remoteDateSynchronizer.syncWithRemote();

      remoteDateSynchronizer.destroy();

      jest.runOnlyPendingTimers();

      expect(emulatedServerPingListener).not.toHaveBeenCalled();
    });
  });
});
