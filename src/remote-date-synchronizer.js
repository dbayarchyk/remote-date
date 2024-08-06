const { RemoteDate } = require("./remote-date");
const {
  estimateRemoteDateEpochWithAccountedNetworkDelay,
} = require("./estimate-remote-date-epoch-with-accounted-network-delay");

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

    const estimatedRemoteDateWhenSyncEnded =
      estimateRemoteDateEpochWithAccountedNetworkDelay({
        receivedRemoteDate: remoteDate,
        syncStartMonotonicTimeInMs,
        serverStartProcessingMonotonicTimeInMs,
        serverEndProcessingMonotonicTimeInMs,
        syncEndMonotonicTimeInMs,
      });

    RemoteDate.init({
      remoteDate: new Date(estimatedRemoteDateWhenSyncEnded),
      referencingMonotonicTime: syncEndMonotonicTimeInMs,
    });
  }
}

module.exports.RemoteDateSynchronizer = RemoteDateSynchronizer;
