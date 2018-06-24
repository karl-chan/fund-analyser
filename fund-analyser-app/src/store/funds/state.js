export default {
  summary: [], // [Fund]
  loaded: {}, // {[isin: string]: Fund]
  realTimeDetails: {}, // {[isin: string]: RealTimeDetails}
  activeJobs: {} // {[isin: string]: {jobId: number, count: number}}
}
