import { supabase } from '@/lib/supabaseClient'
import { Cell, CellFormData, CellMeeting } from '@/types'

export const cellService = {
  async getCells() {
    const { data, error } = await supabase
      .from('cells')
      .select(`
        *,
        leader:users_profile (*),
        members:cell_members (
          *,
          user:users_profile (*)
        )
      `)
      .eq('ativo', true)
      .order('name')

    if (error) throw error
    return data as Cell[]
  },

  async getCellById(id: string) {
    const { data, error } = await supabase
      .from('cells')
      .select(`
        *,
        leader:users_profile (*),
        members:cell_members (
          *,
          user:users_profile (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Cell
  },

  async createCell(cellData: CellFormData) {
    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .insert({
        name: cellData.name,
        leader_id: cellData.leader_id,
        address: cellData.address,
        weekday: cellData.weekday,
        meeting_time: cellData.meeting_time,
        notes: cellData.notes,
      })
      .select()
      .single()

    if (cellError) throw cellError

    // Adicionar membros
    const allMembers = [
      ...cellData.member_ids.map((userId) => ({
        cell_id: cell.id,
        user_id: userId,
        role: 'membro' as const,
      })),
      ...cellData.auxiliar_ids.map((userId) => ({
        cell_id: cell.id,
        user_id: userId,
        role: 'auxiliar' as const,
      })),
    ]

    if (allMembers.length > 0) {
      const { error: membersError } = await supabase
        .from('cell_members')
        .insert(allMembers)

      if (membersError) throw membersError
    }

    return cell
  },

  async updateCell(cellId: string, cellData: Partial<CellFormData>) {
    const { data, error } = await supabase
      .from('cells')
      .update({
        name: cellData.name,
        leader_id: cellData.leader_id,
        address: cellData.address,
        weekday: cellData.weekday,
        meeting_time: cellData.meeting_time,
        notes: cellData.notes,
      })
      .eq('id', cellId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async addCellMember(cellId: string, userId: string, role: 'lider' | 'auxiliar' | 'membro' = 'membro') {
    const { data, error } = await supabase
      .from('cell_members')
      .insert({
        cell_id: cellId,
        user_id: userId,
        role,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeCellMember(memberId: string) {
    const { error } = await supabase
      .from('cell_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error
  },

  async getCellMeetings(cellId: string) {
    const { data, error } = await supabase
      .from('cell_meetings')
      .select(`
        *,
        attendance:cell_attendance (
          *,
          user:users_profile (*)
        )
      `)
      .eq('cell_id', cellId)
      .order('date', { ascending: false })

    if (error) throw error
    return data as CellMeeting[]
  },

  async createCellMeeting(cellId: string, date: string, notes?: string) {
    const { data, error } = await supabase
      .from('cell_meetings')
      .insert({
        cell_id: cellId,
        date,
        notes,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async registerAttendance(meetingId: string, userId: string, present: boolean) {
    const { data, error } = await supabase
      .from('cell_attendance')
      .upsert({
        cell_meeting_id: meetingId,
        user_id: userId,
        present,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deactivateCell(cellId: string) {
    const { data, error } = await supabase
      .from('cells')
      .update({ ativo: false })
      .eq('id', cellId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
