class RemoteDate {
  /**
   * @type {number | null}
   */
  static #referencingEpoch = null;

  /**
   * @type {number | null}
   */
  static #referencingMonotonicTime = null;

  /**
   * @typedef {{
   * remoteDate: Date,
   * referencingMonotonicTime?: number,
   * }} InitOptions
   *
   * @param {InitOptions} options
   */
  static init({ remoteDate, referencingMonotonicTime }) {
    this.#referencingEpoch = Number(remoteDate);
    this.#referencingMonotonicTime =
      referencingMonotonicTime ?? performance.now();
  }

  static destroy() {
    this.#referencingEpoch = null;
    this.#referencingMonotonicTime = null;
  }

  /**
   * @returns {number}
   * */
  static now() {
    if (
      !this.#referencingEpoch ||
      typeof this.#referencingMonotonicTime !== "number"
    ) {
      throw new Error(`${RemoteDate.name} is not synced yet.`);
    }

    return (
      this.#referencingEpoch +
      Math.round(performance.now() - this.#referencingMonotonicTime)
    );
  }
}

module.exports.RemoteDate = RemoteDate;
