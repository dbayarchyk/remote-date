/**
 * @typedef {{
 * syncStartMonotonicTimeInMs: number,
 * receivedRemoteDate: Date,
 * serverStartProcessingMonotonicTimeInMs: number,
 * serverEndProcessingMonotonicTimeInMs: number,
 * syncEndMonotonicTimeInMs: number,
 * }} EstimateCurrentRemoteDateOptions
 *
 * @param {EstimateCurrentRemoteDateOptions} options
 * @returns {number}
 * */
export function estimateRemoteDateEpochWithAccountedNetworkDelay({
  receivedRemoteDate,
  syncStartMonotonicTimeInMs,
  serverStartProcessingMonotonicTimeInMs,
  serverEndProcessingMonotonicTimeInMs,
  syncEndMonotonicTimeInMs,
}) {
  const fullSyncDuration = Math.round(
    syncEndMonotonicTimeInMs - syncStartMonotonicTimeInMs
  );
  const serverProcessingDuration = Math.round(
    serverEndProcessingMonotonicTimeInMs -
      serverStartProcessingMonotonicTimeInMs
  );

  const roundTripNetworkDelay = fullSyncDuration - serverProcessingDuration;

  return Number(receivedRemoteDate) + roundTripNetworkDelay / 2;
}
