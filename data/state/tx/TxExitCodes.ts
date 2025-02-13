// texas is the 28th so that's the prefix
export enum TxExitCode {
  OK = 0,
  GENERAL_FAILURE = 28000,
  FTP_FAILURE = 28001,
  SESSION_IDS_MISSING = 28002,
  JOURNAL_FAILURE = 28003,
  BILL_SCAN_FAILURE = 28004
}