import { RemoteDate } from "./remote-date";
import { estimateRemoteDateEpochWithAccountedNetworkDelay } from "./estimate-remote-date-epoch-with-accounted-network-delay";

/**
 * @typedef {{
 * signal: AbortController['signal'];
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

export class RemoteDateSynchronizer {
  /**
   * @type {FetchRemote | null}
   */
  #fetchRemote = null;

  /**
   * @type {AbortController | null}
   */
  #fetchRemoteAbortController = null;

  /**
   * @type {RemoteDate}
   */
  #remoteDate;

  /**
   * @typedef {{
   * fetchRemote: FetchRemote,
   * remoteDate: RemoteDate,
   * }} InitFromRemoteOptions
   *
   * @param {InitFromRemoteOptions} options
   */
  constructor({ fetchRemote, remoteDate }) {
    this.#fetchRemote = fetchRemote;
    this.#remoteDate = remoteDate;
  }

  destroy() {
    this.#fetchRemote = null;
    if (this.#fetchRemoteAbortController) {
      this.#fetchRemoteAbortController.abort();
      this.#fetchRemoteAbortController = null;
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async syncWithRemote() {
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

    this.#remoteDate.setRemoteTime({
      remoteDate: new Date(estimatedRemoteDateWhenSyncEnded),
      referencingMonotonicTime: syncEndMonotonicTimeInMs,
    });
  }
}
