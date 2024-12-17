import { debounce } from 'lodash'

/**
 * Composable to rewrite the current URL based on a set of query parameters.
 * @returns object with function rewriteQueryParams
 */
export const useRewriteQueryParams = () => {
  /**
   * Rewrites the current URL based on the input query params. Does not change the router state,
   * so be careful if doing operations that rely on the router having current params
   * @param params Params to rewrite. Undefined parameters are omitted from the URL.
   */
  const rewriteQueryParams = debounce(
    (params: Record<string, string | number | undefined>) => {
      const route = useRoute()

      window.history.pushState(
        {},
        '',
        route.path +
          '?' +
          Object.entries(params)
            .filter(([_, value]) => value != null)
            .map(([key, value]) => {
              return (
                encodeURIComponent(key) +
                '=' +
                encodeURIComponent(value!.toString())
              )
            })
            .join('&')
      )
    },
    200
  )

  return { rewriteQueryParams }
}
