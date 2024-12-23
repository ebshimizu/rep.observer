const FavoritesKey = 'ro:favorites'

/**
 * Returns the current set of representative favorites, and functions to manipulate the set of favorites.
 * If an ID is passed when this directive is used, computed values specific to that ID will be returned
 */
export const useFavoriteReps = (activeRepId?: string) => {
  // initial load
  // this is a client side composable so...
  const app = useNuxtApp()

  // this should be a list of IDs or an empty array
  let favorites = ref<string[]>([])

  try {
    if (window) {
      favorites.value = JSON.parse(
        localStorage.getItem(FavoritesKey) ?? '[]'
      ) as string[]
    }
  } catch (e) {
    // if this fails we should log but not block app
    console.error(e)
  }

  const activeIsFavorite = computed(() =>
    activeRepId ? favorites.value.includes(activeRepId) : false
  )

  const isFavorite = (repId: string) => {
    return favorites.value.includes(repId)
  }

  const addFavorite = (repId: string) => {
    // don't do duplicates
    if (!favorites.value.includes(repId)) {
      favorites.value.push(repId)
    }

    // update to local storage
    localStorage.setItem(FavoritesKey, JSON.stringify(favorites.value))
  }

  const removeFavorite = (repId: string) => {
    favorites.value = favorites.value.filter((f) => f !== repId)

    localStorage.setItem(FavoritesKey, JSON.stringify(favorites.value))
  }

  /**
   * Toggles the favorite status for the input rep.
   *
   * If activeRepId was passed to the composable, the repId argument isn't needed and this function
   * will operate on the activeRepId instead
   */
  const toggleFavorite = (repId?: string) => {
    const targetRep = repId ?? activeRepId
    if (targetRep) {
      if (favorites.value.includes(targetRep)) {
        removeFavorite(targetRep)
      } else {
        addFavorite(targetRep)
      }
    }
  }

  return {
    favorites,
    activeIsFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  }
}
