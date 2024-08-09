import { RemoteDate } from "./remote-date";
import { estimateRemoteDateEpochWithAccountedNetworkDelay } from "./estimate-remote-date-epoch-with-accounted-network-delay";

/**
 * @typedef {Object} FetchRemoteOptions
 * @property {AbortSignal} signal
 *
 * @typedef {Object} FetchRemoteResult
 * @property {Date} remoteDate
 * @property {number} serverStartProcessingMonotonicTimeInMs
 * @property {number} serverEndProcessingMonotonicTimeInMs
 *
 * @callback FetchRemote
 * @param {FetchRemoteOptions} options
 * @returns {Promise<FetchRemoteResult>}
 */

/** @class */
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
   * @typedef {Object} RemoteDateSynchronizerOptions
   * @property {FetchRemote} fetchRemote
   * @property {RemoteDate} remoteDate
   */

  /**
   * @param {RemoteDateSynchronizerOptions} options
   */
  constructor({ fetchRemote, remoteDate }) {
    this.#fetchRemote = fetchRemote;
    this.#remoteDate = remoteDate;
  }

  /**
   * Synchronizes the local RemoteDate instance with a remote server's date.
   * It uses a `fetchRemote` function to communicate with the server and estimates the remote date by
   * accounting for network delays during the data transmission.
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

  /**
   * Cleans up any ongoing or future remote fetch operations.
   * @returns {void}
   */
  destroy() {
    this.#fetchRemote = null;
    if (this.#fetchRemoteAbortController) {
      this.#fetchRemoteAbortController.abort();
      this.#fetchRemoteAbortController = null;
    }
  }
}
