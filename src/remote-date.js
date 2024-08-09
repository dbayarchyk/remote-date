/** @class */
export class RemoteDate {
  /**
   * @type {number | null}
   * */
  #referencingEpoch = null;

  /**
   * @type {number | null}
   * */
  #referencingMonotonicTime = null;

  /**
   * @typedef {Object} RemoteDateOptions
   * @property {Date | number} remoteDate
   * @property {number} [referencingMonotonicTime]
   * */

  /**
   * Initializes a new instance of the class with optional remote date settings.
   *
   * @param {RemoteDateOptions | undefined} [options]
   * */
  constructor(options) {
    if (options && options.remoteDate) {
      this.setRemoteTime({
        remoteDate: options.remoteDate,
        referencingMonotonicTime: options.referencingMonotonicTime,
      });
    }
  }

  /**
   * @typedef {Object} SetRemoteTimeOptions
   * @property {Date | number} remoteDate
   * @property {number} [referencingMonotonicTime] - A result of the monotonic clock performance.now() when the removeDate was initialized.
   */

  /**
   * Synchronizes the internal state of the RemoteDate instance with a remote time source.
   *
   * @param {SetRemoteTimeOptions} options
   * @returns {void}
   * */
  setRemoteTime({ remoteDate, referencingMonotonicTime }) {
    this.#referencingEpoch = Number(remoteDate);
    this.#referencingMonotonicTime =
      referencingMonotonicTime ?? performance.now();
  }

  /**
   * Returns the number of milliseconds elapsed since the epoch, which is defined as the midnight at the beginning of January 1, 1970, UTC.
   *
   * The Remote instance needs to be initialized once first via a constructor or remoteDate.setRemoteTime() before being able to use remoteDate.now().
   * @returns {number}
   * */
  now() {
    if (
      !this.#referencingEpoch ||
      typeof this.#referencingMonotonicTime !== "number"
    ) {
      throw new Error(`${RemoteDate.name} is not set yet.`);
    }

    return (
      this.#referencingEpoch +
      Math.round(performance.now() - this.#referencingMonotonicTime)
    );
  }

  /**
   * Returns the newly-created Date object represents the current date and time as of the time of instantiation.
   * The returned date's timestamp is the same as the number returned by remoteDate.now().
   *
   * The Remote instance needs to be initialized once first via a constructor or remoteDate.setRemoteTime() before being able to use remoteDate.dateNow().
   * @returns {Date}
   * */
  dateNow() {
    return new Date(this.now());
  }
}
