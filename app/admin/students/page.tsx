"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Student = {
  _id: string;
  name: string;
  admissionNo: string;
  chestNo: string;
  team: "Auris" | "Libras";
  category: "Alpha" | "Beta" | "Omega" | "General-A" | "General-B";
}

export default function StudentsPage() {
  const { toast } = useToast()
  
  // State
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [formData, setFormData] = useState({
    name: "", admissionNo: "", chestNo: "", team: "", category: "",
  })

  // 1. Fetch Students
  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/student/list')
      setStudents(res.data)
    } catch (error) {
      console.error("Failed to fetch students", error)
    } finally {
      setLoading(false)
    }
  }

  // 2. Add Student
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/student/register', {
        ...formData,
        selectedEvents: [] 
      })
      
      toast({ title: "Success", description: "Student added successfully!" })
      setFormData({ name: "", admissionNo: "", chestNo: "", team: "", category: "" }) 
      setIsDialogOpen(false)
      fetchStudents() 

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to add student." })
    }
  }

  // 3. Delete Student
  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await axios.post('/api/student/delete', { id });
      toast({ title: "Deleted", description: "Student removed." });
      fetchStudents(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    }
  }

  // Filter Logic
  const filteredStudents = students.filter((student) => {
    const q = searchQuery.toLowerCase()
    return (
      student.name.toLowerCase().includes(q) ||
      (student.chestNo && student.chestNo.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">Manage participant registrations</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                <Label>Admission No (Optional)</Label>
                <Input value={formData.admissionNo} onChange={(e) => setFormData({...formData, admissionNo: e.target.value})} />
                </div>
                <div className="space-y-2">
                <Label>Chest Number</Label>
                <Input value={formData.chestNo} onChange={(e) => setFormData({...formData, chestNo: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        {["Alpha", "Beta", "Omega", "General-A", "General-B"].map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Team</Label>
                    <Select onValueChange={(val) => setFormData({...formData, team: val})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Auris">Auris</SelectItem>
                        <SelectItem value="Libras">Libras</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                </div>
                <Button type="submit" className="w-full">Save Student</Button>
            </form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name or chest no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* --- NEW: SI No Header --- */}
                  <TableHead className="w-[60px]">SI</TableHead> 
                  <TableHead>Chest No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto h-6 w-6 text-slate-400"/></TableCell></TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No students found. Add one to start!
                    </TableCell>
                  </TableRow>
                ) : (
                  // --- NEW: Added 'index' to map ---
                  filteredStudents.map((student, index) => (
                    <TableRow key={student._id}>
                      {/* --- NEW: Display Serial Number --- */}
                      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                      
                      <TableCell className="font-mono font-bold">{student.chestNo}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.team === "Auris" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                          {student.team}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-xs bg-slate-100 px-2 py-1 rounded">{student.category}</span></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(student._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
    </div>
  )
}