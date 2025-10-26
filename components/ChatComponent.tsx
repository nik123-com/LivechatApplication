'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ChatComponent() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!userName) {
      const name = prompt("Please enter your name:")
      if (name) {
        setUserName(name)
        sendSystemMessage(`${name} joined`)
      } else {
        alert("Name cannot be empty!")
      }
    }

    // Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(current => [...current, payload.new])
      })
      .subscribe()

    // Fetch existing messages
    fetchMessages()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userName])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) console.error('Error fetching messages:', error)
    else setMessages(data || [])
  }

  const sendMessage = async () => {
    if (newMessage.trim() && userName) {
      const message = {
        id: uuidv4(),
        user: userName,
        text: newMessage.trim(),
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('messages').insert(message)
      if (error) console.error('Error sending message:', error)
      else setNewMessage('')
    }
  }

  const sendSystemMessage = async (text: string) => {
    const message = {
      id: uuidv4(),
      user: 'System',
      text: text,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('messages').insert(message)
    if (error) console.error('Error sending system message:', error)
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-500 text-white p-4 text-center font-bold">Live Chat</div>
      <div className="h-96 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 rounded-lg ${
              message.user === userName ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
            } ${message.user === 'System' ? 'bg-yellow-100 text-center' : ''} max-w-[70%]`}
          >
            {message.user !== 'System' && <span className="font-bold">{message.user}: </span>}
            {message.text}
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-grow p-2 border rounded-lg"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

