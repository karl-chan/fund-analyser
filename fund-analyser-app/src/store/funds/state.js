export default {
  summary: [], // [Fund]
  favouriteIsins: [], // [isin: string]
  loaded: {}, // {[isin: string]: Fund]
  realTimeDetails: {}, // {[isin: string]: RealTimeDetails}
  activeJobs: {} // {[isin: string]: {jobId: number, count: number}}
}
