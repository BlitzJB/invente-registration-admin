'use client'

import { useState, useEffect, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, Eye } from "lucide-react"
import * as XLSX from 'xlsx'

type Event = 'bizquiz' | 'econexus' | 'stocksim' | 'admania' | 'cryptohunt' | 'startup'

type Session = {
  name: string
  phoneNumber: string
  email: string
  college: string
  year: string
  department: string
  rollNumber: string
  selectedEvents?: Event[]
  paymentProof?: string
  sessionId: string
  timestamp: number
}

type ResponseData = {
  completedSessions: Session[]
  incompleteSessions: Session[]
}

const eventColors: Record<Event, string> = {
  bizquiz: 'bg-blue-500',
  econexus: 'bg-green-500',
  stocksim: 'bg-yellow-500',
  admania: 'bg-purple-500',
  cryptohunt: 'bg-red-500',
  startup: 'bg-indigo-500',
}

export function AdminDashboard() {
  const [data, setData] = useState<ResponseData>({
    completedSessions: [],
    incompleteSessions: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://invente.blitzdnd.com/api/getFormData', {
          headers: {
            'Authorization': 'Bearer 4c43fbeb52d6b5b0d0d2ae670759719d'
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const responseData = await response.json()
        
        // Process and categorize the data
        const processedData: ResponseData = {
          completedSessions: [],
          incompleteSessions: []
        }

        const common = [...responseData.completedSessions, ...responseData.incompleteSessions]

        common.forEach((session: any) => {
          const processedSession: Session = {
            name: session.name || 'N/A',
            phoneNumber: session.phoneNumber || 'N/A',
            email: session.email || 'N/A',
            college: session.college || 'N/A',
            year: session.year || 'N/A',
            department: session.department || 'N/A',
            rollNumber: session.rollNumber || 'N/A',
            selectedEvents: session.selectedEvents || [],
            paymentProof: session.paymentProof,
            sessionId: session.sessionId || 'N/A',
            timestamp: session.timestamp ? new Date(session.timestamp).getTime() : Date.now()
          }

          if (session.paymentProof) {
            processedData.completedSessions.push(processedSession)
          } else {
            processedData.incompleteSessions.push(processedSession)
          }
        })

        setData(processedData)
        setIsLoading(false)
      } catch (err) {
        setError('Failed to fetch data. Please try again later. ' + err)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])

  const toggleEvent = (event: Event) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  const filteredSessions = useMemo(() => {
    const filterSessions = (sessions: Session[]) =>
      sessions.filter(session =>
        selectedEvents.length === 0 || 
        selectedEvents.some(event => session.selectedEvents?.includes(event))
      )

    return {
      completedSessions: filterSessions(data.completedSessions),
      incompleteSessions: filterSessions(data.incompleteSessions)
    }
  }, [data, selectedEvents])

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const exportToExcel = (sessions: Session[], filename: string) => {
    const data = sessions.map(session => ({
      ...session,
      timestamp: formatDateTime(session.timestamp),
      selectedEvents: session.selectedEvents?.join(', ') || ''
    }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses")
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  const renderTable = (sessions: Session[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>College</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Roll Number</TableHead>
          <TableHead>Events</TableHead>
          <TableHead className="whitespace-nowrap">Date & Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.sessionId}>
            <TableCell>{session.name}</TableCell>
            <TableCell>{session.phoneNumber}</TableCell>
            <TableCell>{session.email}</TableCell>
            <TableCell>{session.college}</TableCell>
            <TableCell>{session.year}</TableCell>
            <TableCell>{session.department}</TableCell>
            <TableCell>{session.rollNumber}</TableCell>
            <TableCell>
              {session.selectedEvents?.map((event) => (
                <Badge key={event} className={`mr-1 ${eventColors[event]} text-white`}>
                  {event}
                </Badge>
              ))}
            </TableCell>
            <TableCell className="whitespace-nowrap">{formatDateTime(session.timestamp)}</TableCell>
            <TableCell>
              {session.paymentProof && (
                <Button variant="outline" size="sm" asChild>
                  <a href={"https://invente.blitzdnd.com/" + session.paymentProof} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" /> Payment Proof
                  </a>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Form Responses Manager</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Filter by Events</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(eventColors).map(([event, color]) => (
            <div key={event} className="flex items-center">
              <Checkbox
                id={event}
                checked={selectedEvents.includes(event as Event)}
                onCheckedChange={() => toggleEvent(event as Event)}
              />
              <Label htmlFor={event} className="ml-2">
                <Badge className={`${color} text-white`}>
                  {event}
                </Badge>
              </Label>
            </div>
          ))}
        </div>
      </div>
      <Tabs defaultValue="completed" className="w-full">
        <TabsList>
          <TabsTrigger value="completed">Completed Sessions</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="completed">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Completed Sessions</h2>
            <Button onClick={() => exportToExcel(filteredSessions.completedSessions, "completed_sessions")}>
              <Download className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
          </div>
          {renderTable(filteredSessions.completedSessions)}
        </TabsContent>
        <TabsContent value="incomplete">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Incomplete Sessions</h2>
            <Button onClick={() => exportToExcel(filteredSessions.incompleteSessions, "incomplete_sessions")}>
              <Download className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
          </div>
          {renderTable(filteredSessions.incompleteSessions)}
        </TabsContent>
      </Tabs>
    </div>
  )
}