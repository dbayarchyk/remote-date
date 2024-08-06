const { RemoteDate } = require("./remote-date");

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

class RemoteDateSynchronizer {
  /**
   * @type {FetchRemote | null}
   */
  static #fetchRemote = null;

  /**
   * @type {AbortController | null}
   */
  static #fetchRemoteAbortController = null;

  static destroy() {
    this.#fetchRemote = null;
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
  static async initRemoteDateFromRemote({ fetchRemote }) {
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

    RemoteDate.init({
      remoteDate: new Date(estimatedRemoteDateWhenSyncEnded),
      referencingMonotonicTime: syncEndMonotonicTimeInMs,
    });
  }
}

module.exports.RemoteDateSynchronizer = RemoteDateSynchronizer;
