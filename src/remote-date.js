/**
 * @typedef {{
 *  signal: AbortController['signal'];
 * }} FetchRemoteOptions
 *
 * @typedef {{
 * remoteDate: Date,
 * serverStartProcessingMonotonicTimeInMs: number,
 * serverEndProcessingMonotonicTimeInMs: number,
 * }} FetchRemoteResult
 *
 * @typedef {(options: FetchRemoteOptions) => Promise<FetchRemoteResult>} FetchRemote
 */

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
   * @type {FetchRemote | null}
   */
  static #fetchRemote = null;

  /**
   * @type {AbortController | null}
   */
  static #fetchRemoteAbortController = null;

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
    this.#fetchRemote = null;
    this.#referencingEpoch = null;
    this.#referencingMonotonicTime = null;
    if (this.#fetchRemoteAbortController) {
      this.#fetchRemoteAbortController.abort();
      this.#fetchRemoteAbortController = null;
    }
  }

  /**
   * @typedef {{
   * fetchRemote: FetchRemote
   * }} InitFromRemoteOptions
   *
   * @param {InitFromRemoteOptions} options
   * @returns {Promise<void>}
   */
  static async initFromRemote({ fetchRemote }) {
    this.#fetchRemote = fetchRemote;
    await this.#syncWithRemote();
  }

  /**
   * @returns {Promise<void>}
   */
  static async #syncWithRemote() {
    if (!this.#fetchRemote) {
      throw new Error(
        `${RemoteDate.name} is not initialized yet with the fetchRemote function.`
      );
    }

    if (this.#fetchRemoteAbortController) {
      this.#fetchRemoteAbortController.abort();
    }
    this.#fetchRemoteAbortController = new AbortController();

    const syncStartMonotonicTimeInMs = performance.now();
    const {
      serverStartProcessingMonotonicTimeInMs,
      remoteDate,
      serverEndProcessingMonotonicTimeInMs,
    } = await this.#fetchRemote({
      signal: this.#fetchRemoteAbortController.signal,
    });
    const syncEndMonotonicTimeInMs = performance.now();

    const fullSyncDuration = Math.round(
      syncEndMonotonicTimeInMs - syncStartMonotonicTimeInMs
    );
    const serverProcessingDuration = Math.round(
      serverEndProcessingMonotonicTimeInMs -
        serverStartProcessingMonotonicTimeInMs
    );

    const roundTripNetworkDelay = fullSyncDuration - serverProcessingDuration;

    const estimatedRemoteDateWhenSyncEnded =
      Number(remoteDate) + roundTripNetworkDelay / 2;

    this.init({
      remoteDate: new Date(estimatedRemoteDateWhenSyncEnded),
      referencingMonotonicTime: syncEndMonotonicTimeInMs,
    });
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
