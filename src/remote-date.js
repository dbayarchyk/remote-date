export class RemoteDate {
  /**
   * @type {number | null}
   */
  #referencingEpoch = null;

  /**
   * @type {number | null}
   */
  #referencingMonotonicTime = null;

  /**
   * @typedef {{
   * remoteDate: Date | number,
   * referencingMonotonicTime?: number,
   * }} RemoteDateOptions
   *
   * @param {RemoteDateOptions | undefined} [options]
   */
  constructor(options) {
    if (options && options.remoteDate) {
      this.setRemoteTime({
        remoteDate: options.remoteDate,
        referencingMonotonicTime: options.referencingMonotonicTime,
      });
    }
  }

  /**
   * @typedef {{
   * remoteDate: Date | number,
   * referencingMonotonicTime?: number,
   * }} InitOptions
   *
   * @param {InitOptions} options
   */
  setRemoteTime({ remoteDate, referencingMonotonicTime }) {
    this.#referencingEpoch = Number(remoteDate);
    this.#referencingMonotonicTime =
      referencingMonotonicTime ?? performance.now();
  }

  /**
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
   * @returns {Date}
   * */
  dateNow() {
    return new Date(this.now());
  }
}
