"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Search, Loader2, QrCode, Download, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"
import QRCode from "qrcode"
import ExcelJS from "exceljs"
import { useRouter } from "next/navigation"

type Student = {
  _id: string;
  name: string;
  admissionNo: string;
  chestNo: string;
  team: "Ignis" | "Ventus";
  category: "Protons" | "Nexus" | "Cosmos" | "General-A" | "General-B";
  studentClass: string;
}

export default function StudentsPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  // State
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [teamFilter, setTeamFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [classFilter, setClassFilter] = useState("All")
  
  // Form State
  const [formData, setFormData] = useState({
    name: "", admissionNo: "", chestNo: "", team: "", category: "", studentClass: ""
  })
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string } | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const handleViewQr = async (student: Student) => {
    setSelectedStudentForQr(student);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/student/${student.chestNo}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
      setQrDataUrl(dataUrl);
      setQrModalOpen(true);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }
  }

  const [isDownloadingZips, setIsDownloadingZips] = useState(false);

  const handleDownloadAllPNGs = async () => {
    setIsDownloadingZips(true);
    toast({ title: "Generating ZIP...", description: "Please wait while we generate all QR codes." });
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      
      for (const student of filteredStudents) {
        const url = `${origin}/student/${student.chestNo}`;
        const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 400 });
        const base64Data = dataUrl.split(',')[1];
        zip.file(`${student.chestNo}_${student.name}.png`, base64Data, { base64: true });
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObject;
      a.download = "Optimus_Student_QRCodes.zip";
      a.click();
      window.URL.revokeObjectURL(urlObject);
      
      toast({ title: "Success!", description: "QR Codes downloaded successfully." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to create ZIP." });
    } finally {
      setIsDownloadingZips(false);
    }
  }

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
      setFormData({ name: "", admissionNo: "", chestNo: "", team: "", category: "", studentClass: "" }); 
      setIsDialogOpen(false)
      fetchStudents() 

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to add student." })
    }
  }

  // 3. Delete Student
  const handleDelete = (id: string, studentName?: string) => {
    setStudentToDelete({ id, name: studentName || '' });
    setDeleteModalOpen(true);
  }

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await axios.post('/api/student/delete', { id: studentToDelete.id });
      toast({ title: "Deleted", description: "Student removed." });
      fetchStudents(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    } finally {
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  }

  // Filter Logic
  const filteredStudents = students.filter((student) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = student.name.toLowerCase().includes(q) || (student.chestNo && student.chestNo.toLowerCase().includes(q))
    const matchTeam = teamFilter === "All" || student.team === teamFilter
    const matchCategory = categoryFilter === "All" || student.category === categoryFilter
    const matchClass = classFilter === "All" || student.studentClass === classFilter
    return matchSearch && matchTeam && matchCategory && matchClass
  })

  // Export Excel Logic
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const title = teamFilter === "All" ? "All Students" : `Team ${teamFilter}`;
      const sheet = workbook.addWorksheet(title);

      sheet.columns = [
        { header: 'SI', key: 'si', width: 5 },
        { header: 'Chest No', key: 'chestNo', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Team', key: 'team', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Class', key: 'studentClass', width: 15 },
        { header: 'QR Code', key: 'qr', width: 25 }
      ];

      // Generate URLs and add rows
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      
      for (let i = 0; i < filteredStudents.length; i++) {
        const s = filteredStudents[i];
        const rowIndex = i + 2; // +1 for 0-index, +1 because row 1 is headers

        sheet.addRow({
          si: i + 1,
          chestNo: s.chestNo,
          name: s.name,
          team: s.team,
          category: s.category,
          studentClass: s.studentClass,
        });

        // Increase row height so the image fits nicely
        sheet.getRow(rowIndex).height = 100;

        // Generate QR Code base64
        const url = `${origin}/student/${s.chestNo}`;
        const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 150 });
        
        // Strip out the base64 header
        const base64Data = qrDataUrl.split(',')[1];
        
        const imageId = workbook.addImage({
          base64: base64Data,
          extension: 'png',
        });

        sheet.addImage(imageId, {
          tl: { col: 6, row: rowIndex - 1 }, // Column index is 0-based: col 6 is 'QR Code'. Row index is also 0-based
          ext: { width: 100, height: 100 }
        });
        
        // Center align cells
        sheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Header styling
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObject;
      a.download = `${title.replace(/\s+/g, '_')}_QR_List.xlsx`;
      a.click();
      window.URL.revokeObjectURL(urlObject);
      
      toast({ title: "Success", description: "Excel sheet downloaded successfully!" });
    } catch (error) {
      console.error("Failed to export Excel", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate Excel file." });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">Manage participant registrations</p>
        </div>

        <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={handleDownloadAllPNGs} className="bg-white border-slate-200 text-slate-700 shadow-sm" disabled={isDownloadingZips}>
                {isDownloadingZips ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2 text-blue-600" />} Download All PNGs
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="bg-white border-slate-200 text-slate-700 shadow-sm">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Export Excel
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                <Button className="bg-slate-100 text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-200">
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
                    <Select onValueChange={(val) => setFormData({...formData, category: val, studentClass: ""})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        {["Protons", "Nexus", "Cosmos"].map((cat) => (
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
                        <SelectItem value="Ignis">Ignis</SelectItem>
                        <SelectItem value="Ventus">Ventus</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-2">
                    <Label>Class</Label>
                    <Select onValueChange={(val) => setFormData({...formData, studentClass: val})}>
                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>
                        {(
                            formData.category === "Protons" ? ['8', '9'] :
                            formData.category === "Nexus" ? ['10', 'HS1', 'HS2', 'BS1'] :
                            formData.category === "Cosmos" ? ['BS2', 'BS3', 'BS4', 'BS5'] :
                            formData.category === "General-A" ? ['8', '9', '10'] :
                            formData.category === "General-B" ? ['HS1', 'HS2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5'] :
                            []
                        ).map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                </div>
                <Button type="submit" className="w-full">Save Student</Button>
            </form>
            </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name or chest no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              <div className="w-[140px] shrink-0">
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Teams</SelectItem>
                    <SelectItem value="Ignis">Ignis</SelectItem>
                    <SelectItem value="Ventus">Ventus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px] shrink-0">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Protons">Protons</SelectItem>
                    <SelectItem value="Nexus">Nexus</SelectItem>
                    <SelectItem value="Cosmos">Cosmos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[120px] shrink-0">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Classes</SelectItem>
                    {['8', '9', '10', 'HS1', 'HS2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5'].map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">SI</TableHead> 
                  <TableHead>Chest No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto h-6 w-6 text-slate-400"/></TableCell></TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No students found. Add one to start!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                      
                      <TableCell className="font-mono font-bold">{student.chestNo}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.team === "Ignis" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                          {student.team}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          student.category === "Protons" ? "bg-purple-100 text-purple-700" :
                          student.category === "Nexus" ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{student.category}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-500">{student.studentClass}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50 mr-2" onClick={() => handleViewQr(student)}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(student._id, student.name)}>
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
      <DeleteConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        studentName={studentToDelete?.name}
      />

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md flex flex-col items-center justify-center text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">{selectedStudentForQr?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center w-full">
            <div className="flex gap-2 mb-4">
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Chest: {selectedStudentForQr?.chestNo}</span>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Team: {selectedStudentForQr?.team}</span>
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 border-4 border-slate-100 rounded-xl mb-2" />}
            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">Scan to view programs</p>
          </div>
          <div className="w-full">
            <Button variant="outline" className="w-full font-bold" onClick={() => setQrModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}