import { supabase } from '../../../lib/supabase';
import { NoterBook, NoterChapter, NoterNote } from '../../../types';
import * as Crypto from 'expo-crypto';
import { nanoid } from 'nanoid/non-secure';

export async function getBooks(): Promise<NoterBook[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];

  const { data, error } = await supabase
    .from('noter_books')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as NoterBook[];
}

export async function addBook(data: Omit<NoterBook, 'id' | 'user_id' | 'created_at'>): Promise<NoterBook> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not logged in');

  const { data: book, error } = await supabase
    .from('noter_books')
    .insert({
      id: Crypto.randomUUID(),
      user_id: userData.user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return book as NoterBook;
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('noter_books').delete().eq('id', id);
  if (error) throw error;
}

export async function getChapters(bookId: string): Promise<NoterChapter[]> {
  const { data, error } = await supabase
    .from('noter_chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as NoterChapter[];
}

export async function addChapter(data: Omit<NoterChapter, 'id'>): Promise<NoterChapter> {
  const { data: chapter, error } = await supabase
    .from('noter_chapters')
    .insert({
      id: Crypto.randomUUID(),
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return chapter as NoterChapter;
}

export async function getNotes(bookId: string): Promise<NoterNote[]> {
  const { data, error } = await supabase
    .from('noter_notes')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as NoterNote[];
}

export async function addNote(data: Omit<NoterNote, 'id' | 'user_id' | 'created_at'>): Promise<NoterNote> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not logged in');

  const { data: note, error } = await supabase
    .from('noter_notes')
    .insert({
      id: nanoid(),
      user_id: userData.user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return note as NoterNote;
}

export async function updateNote(id: string, data: Partial<NoterNote>): Promise<NoterNote> {
  const { data: note, error } = await supabase
    .from('noter_notes')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return note as NoterNote;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('noter_notes').delete().eq('id', id);
  if (error) throw error;
}

export async function updateNoteOrder(notes: { id: string; order_index: number }[]): Promise<void> {
  const { error } = await supabase.from('noter_notes').upsert(notes);
  if (error) throw error;
}
