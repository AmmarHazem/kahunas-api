export interface IPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
