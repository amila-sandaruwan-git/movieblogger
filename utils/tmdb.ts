// utils/tmdb.ts
export function getTMDBImageUrl(path: string, size: 'w200' | 'w300' | 'w400' | 'w500' | 'original' = 'original') {
  if (!path) return null
  
  const sizes = {
    w200: 'w200',
    w300: 'w300',
    w400: 'w400',
    w500: 'w500',
    original: 'original'
  }
  
  return `https://image.tmdb.org/t/p/${sizes[size]}${path}`
}

export function getTMDBBackdropUrl(path: string) {
  return getTMDBImageUrl(path, 'original')
}

export function getTMDBPosterUrl(path: string) {
  return getTMDBImageUrl(path, 'w500')
}