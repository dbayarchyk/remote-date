import { RemoteDate } from "./remote-date";

describe("RemoteDate", () => {
  describe("setSystemTime", () => {
    it("should initialize the RemoteDate value to be able to use RemoteDate.now() later", () => {
      const remoteDate = new RemoteDate();

      remoteDate.setRemoteTime({ remoteDate: new Date("2024-08-05T00:00Z") });

      expect(remoteDate.now()).toEqual(expect.any(Number));
    });
  });

  describe("now", () => {
    describe("given not initialized", () => {
      it("should throw the error when called before initializing", () => {
        const remoteDate = new RemoteDate();
        expect(() => remoteDate.now()).toThrow(
          new Error("RemoteDate is not set yet.")
        );
      });
    });

    describe("given initialized with the default referencing monotonic time", () => {
      it("should return the correct epoch milliseconds equal to the estimated current remote date", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));

        const remoteDate = new RemoteDate({
          remoteDate: new Date("2024-08-05T00:00Z"),
        });

        let remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816000000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:00Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816001000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:01Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816002000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:02Z"));
      });
    });

    describe("given initialized with the custom referencing monotonic time", () => {
      it("should return the correct epoch milliseconds equal to the estimated current remote date", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));
        jest.advanceTimersByTime(10_000);

        const remoteDate = new RemoteDate({
          remoteDate: new Date("2024-08-05T00:00Z"),
          referencingMonotonicTime: performance.now(),
        });

        let remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816000000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:00Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816001000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:01Z"));

        jest.advanceTimersByTime(1_000);
        remoteNow = remoteDate.now();
        expect(remoteNow).toEqual(1722816002000);
        expect(new Date(remoteNow)).toEqual(new Date("2024-08-05T00:00:02Z"));
      });
    });
  });

  describe("dateNow", () => {
    describe("given not initialized", () => {
      it("should throw the error when called before initializing", () => {
        const remoteDate = new RemoteDate();
        expect(() => remoteDate.dateNow()).toThrow(
          new Error("RemoteDate is not set yet.")
        );
      });
    });

    describe("given initialized with the default referencing monotonic time", () => {
      it("should return the correct epoch milliseconds equal to the estimated current remote date", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));

        const remoteDate = new RemoteDate({
          remoteDate: new Date("2024-08-05T00:00Z"),
        });

        expect(remoteDate.dateNow()).toEqual(new Date("2024-08-05T00:00:00Z"));

        jest.advanceTimersByTime(1_000);
        expect(remoteDate.dateNow()).toEqual(new Date("2024-08-05T00:00:01Z"));

        jest.advanceTimersByTime(1_000);
        expect(remoteDate.dateNow()).toEqual(new Date("2024-08-05T00:00:02Z"));
      });
    });

    describe("given initialized with the custom referencing monotonic time", () => {
      it("should return the correct epoch milliseconds equal to the estimated current remote date", () => {
        jest.useFakeTimers().setSystemTime(new Date("2024-08-05T18:00Z"));
        jest.advanceTimersByTime(10_000);

        const remoteDate = new RemoteDate({
          remoteDate: new Date("2024-08-05T00:00Z"),
          referencingMonotonicTime: performance.now(),
        });

        expect(remoteDate.dateNow()).toEqual(new Date("2024-08-05T00:00:00Z"));

        jest.advanceTimersByTime(1_000);
        expect(remoteDate.dateNow()).toEqual(new Date("2024-08-05T00:00:01Z"));

        jest.advanceTimersByTime(1_000);
        expect(remoteDate.dateNow()).toEqual(new Date("2024-08-05T00:00:02Z"));
      });
    });
  });
});
