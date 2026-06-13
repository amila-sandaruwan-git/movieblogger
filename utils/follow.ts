// utils/follow.ts
import { createClient } from '@/lib/supabase/client'

export async function followUser(followerId: string, followingId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      })

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Error following user:', error)
    return { success: false, error: error.message }
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Error unfollowing user:', error)
    return { success: false, error: error.message }
  }
}

export async function checkFollowStatus(followerId: string, followingId: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { isFollowing: !!data }
  } catch (error: any) {
    console.error('Error checking follow status:', error)
    return { isFollowing: false, error: error.message }
  }
}

export async function getFollowStats(userId: string) {
  const supabase = createClient()
  
  try {
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    return {
      followers: followerCount || 0,
      following: followingCount || 0
    }
  } catch (error: any) {
    console.error('Error getting follow stats:', error)
    return { followers: 0, following: 0, error: error.message }
  }
}