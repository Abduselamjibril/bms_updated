import React, { useEffect, useMemo, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { listBuildings } from '../api/buildings'
import { workforceApi, WorkforcePersonType } from '../api/workforce'
import api from '../api/axios'
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  IdCard,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
  UserCheck,
  Users,
  XCircle,
  Pencil,
} from 'lucide-react'

const tabs = [
  'Overview',
  'Agencies',
  'Contracts',
  'Agency Staff',
  'Assignments',
  'Attendance',
  'Internal Staff',
  'Leave',
]

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white transition-all'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all'

export default function Workforce() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<any>({})
  const [agencies, setAgencies] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [agencyStaff, setAgencyStaff] = useState<any[]>([])
  const [internalStaff, setInternalStaff] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])

  const [agencyForm, setAgencyForm] = useState<any>({ status: 'active' })
  const [contractForm, setContractForm] = useState<any>({ status: 'active', alert_days_before_expiry: 30 })
  const [agencyStaffForm, setAgencyStaffForm] = useState<any>({ status: 'active', gender: '' })
  const [internalForm, setInternalForm] = useState<any>({ status: 'active', gender: '', annual_leave_balance: 20 })
  const [assignmentForm, setAssignmentForm] = useState<any>({ person_type: 'agency', shift: 'morning', is_active: true })
  const [attendanceForm, setAttendanceForm] = useState<any>({ person_type: 'agency', attendance_date: new Date().toISOString().slice(0, 10) })
  const [leaveForm, setLeaveForm] = useState<any>({ leave_type: 'annual' })
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  const formatDate = (val: any) => {
    if (!val) return ''
    return typeof val === 'string' ? val.slice(0, 10) : ''
  }

  useEffect(() => {
    loadAll()
    listBuildings({ page: 1, per_page: 500 }).then((res: any) => setBuildings(Array.isArray(res) ? res : (res.data || []))).catch(() => {})
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [
        overviewRes,
        agenciesRes,
        contractsRes,
        agencyStaffRes,
        internalStaffRes,
        assignmentsRes,
        attendanceRes,
        leavesRes,
      ] = await Promise.all([
        workforceApi.overview(),
        workforceApi.listAgencies(),
        workforceApi.listContracts(),
        workforceApi.listAgencyEmployees(),
        workforceApi.listInternalEmployees(),
        workforceApi.listAssignments(),
        workforceApi.listAttendance(),
        workforceApi.listLeaves(),
      ])
      setOverview(overviewRes || {})
      setAgencies(agenciesRes || [])
      setContracts(contractsRes || [])
      setAgencyStaff(agencyStaffRes || [])
      setInternalStaff(internalStaffRes || [])
      setAssignments(assignmentsRes || [])
      setAttendance(attendanceRes || [])
      setLeaves(leavesRes || [])
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to load workforce data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const personOptions = useMemo(() => {
    if (assignmentForm.person_type === 'internal' || attendanceForm.person_type === 'internal') {
      return internalStaff.map(e => ({ id: e.id, label: `${e.full_name} - ${e.position}` }))
    }
    return agencyStaff.map(e => ({ id: e.id, label: `${e.full_name} - ${e.position}` }))
  }, [agencyStaff, internalStaff, assignmentForm.person_type, attendanceForm.person_type])

  async function submit(action: () => Promise<any>, success: string, reset?: () => void) {
    try {
      await action()
      toast.addToast(success, 'success')
      reset?.()
      setEditingId(null)
      loadAll()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join(', ') : (msg || 'Operation failed'), 'error')
    }
  }

  function staffName(row: any) {
    return row.agency_employee?.full_name || row.internal_employee?.full_name || row.employee?.full_name || 'Staff'
  }

  function clean(dto: any) {
    return Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== '' && value !== undefined && value !== null))
  }

  return (
    <PageLayout
      title="Workforce"
      subtitle="Manage agencies, outsourced staff, assignments, attendance, internal employees, and leave."
      actions={
        <button onClick={loadAll} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-700">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setEditingId(null)
                setAgencyForm({ status: 'active' })
                setContractForm({ status: 'active', alert_days_before_expiry: 30 })
                setAgencyStaffForm({ status: 'active', gender: '' })
                setInternalForm({ status: 'active', gender: '', annual_leave_balance: 20 })
                setAssignmentForm({ person_type: 'agency', shift: 'morning', is_active: true })
                setAttendanceForm({ person_type: 'agency', attendance_date: new Date().toISOString().slice(0, 10) })
                setLeaveForm({ leave_type: 'annual' })
              }}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border border-slate-100 dark:border-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Metric icon={BriefcaseBusiness} label="Active Agencies" value={overview.active_agencies || 0} />
              <Metric icon={Users} label="Agency Staff" value={overview.agency_employees || 0} />
              <Metric icon={UserCheck} label="Internal Staff" value={overview.internal_employees || 0} />
              <Metric icon={Building2} label="Assignments" value={overview.active_assignments || 0} />
              <Metric icon={Clock} label="Today Attendance" value={overview.today_attendance || 0} />
              <Metric icon={CalendarClock} label="Pending Leave" value={overview.pending_leaves || 0} />
              <Metric icon={FileText} label="Contracts Expiring" value={overview.contracts_expiring_soon || 0} />
              <Metric icon={IdCard} label="Licenses Expiring" value={overview.licenses_expiring_soon || 0} />
            </div>
            <Panel title="Workflow">
              <div className="grid gap-3 md:grid-cols-3">
                <WorkflowStep title="1. Register" text="Create agencies, contracts, agency staff, and internal staff profiles." />
                <WorkflowStep title="2. Assign" text="Assign each staff member to a building, floor, and shift." />
                <WorkflowStep title="3. Control" text="Track attendance, leave, contract expiry, and license expiry." />
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'Agencies' && (
          <CrudSection 
            title={editingId ? "Edit Agency" : "Agency Registration"} 
            isEditing={!!editingId}
            onCancel={() => {
              setEditingId(null)
              setAgencyForm({ status: 'active' })
            }}
            onSubmit={() => submit(
              () => editingId ? workforceApi.updateAgency(editingId, clean(agencyForm)) : workforceApi.createAgency(clean(agencyForm)),
              editingId ? 'Agency updated' : 'Agency registered',
              () => setAgencyForm({ status: 'active' })
            )}
          >
            <Field label="Agency Name" value={agencyForm.name || ''} onChange={name => setAgencyForm({ ...agencyForm, name })} required />
            <Field label="License Number" value={agencyForm.license_number || ''} onChange={license_number => setAgencyForm({ ...agencyForm, license_number })} />
            <Field label="License Expiry" type="date" value={agencyForm.license_expiry_date || ''} onChange={license_expiry_date => setAgencyForm({ ...agencyForm, license_expiry_date })} />
            <Field label="Contact Person" value={agencyForm.contact_person || ''} onChange={contact_person => setAgencyForm({ ...agencyForm, contact_person })} />
            <Field label="Phone" value={agencyForm.phone || ''} onChange={phone => setAgencyForm({ ...agencyForm, phone })} />
            <Field label="Email" type="email" value={agencyForm.email || ''} onChange={email => setAgencyForm({ ...agencyForm, email })} />
            <Field label="Address" value={agencyForm.address || ''} onChange={address => setAgencyForm({ ...agencyForm, address })} />
            <Field label="Services Provided" value={agencyForm.services_provided || ''} onChange={services_provided => setAgencyForm({ ...agencyForm, services_provided })} />
            <Select label="Status" value={agencyForm.status || 'active'} onChange={status => setAgencyForm({ ...agencyForm, status })} options={['active', 'inactive', 'suspended']} />
            <TableList 
              rows={agencies} 
              columns={['name', 'contact_person', 'email', 'phone', 'address', 'services_provided', 'status']} 
              onDelete={id => submit(() => workforceApi.deleteAgency(id), 'Agency removed')} 
              onEdit={row => {
                setEditingId(row.id)
                setAgencyForm({
                  name: row.name || '',
                  license_number: row.license_number || '',
                  license_expiry_date: formatDate(row.license_expiry_date),
                  contact_person: row.contact_person || '',
                  phone: row.phone || '',
                  email: row.email || '',
                  address: row.address || '',
                  services_provided: row.services_provided || '',
                  status: row.status || 'active',
                })
              }}
            />
          </CrudSection>
        )}

        {activeTab === 'Contracts' && (
          <CrudSection 
            title={editingId ? "Edit Contract" : "Agency Contracts"} 
            isEditing={!!editingId}
            onCancel={() => {
              setEditingId(null)
              setContractForm({ status: 'active', alert_days_before_expiry: 30 })
            }}
            onSubmit={() => submit(
              () => editingId ? workforceApi.updateContract(editingId, clean(contractForm)) : workforceApi.createContract(clean(contractForm)),
              editingId ? 'Contract updated' : 'Contract registered',
              () => setContractForm({ status: 'active', alert_days_before_expiry: 30 })
            )}
          >
            <Select label="Agency" value={contractForm.agency_id || ''} onChange={agency_id => setContractForm({ ...contractForm, agency_id })} options={agencies.map(a => ({ value: a.id, label: a.name }))} required />
            <Field label="Contract Title" value={contractForm.title || ''} onChange={title => setContractForm({ ...contractForm, title })} required />
            <Field label="Start Date" type="date" value={contractForm.start_date || ''} onChange={start_date => setContractForm({ ...contractForm, start_date })} required />
            <Field label="End Date" type="date" value={contractForm.end_date || ''} onChange={end_date => setContractForm({ ...contractForm, end_date })} required />
            <Field label="Contract Value" type="number" value={contractForm.contract_value || ''} onChange={contract_value => setContractForm({ ...contractForm, contract_value: Number(contract_value) })} />
            <Field label="Alert Days Before Expiry" type="number" value={contractForm.alert_days_before_expiry || 30} onChange={alert_days => setContractForm({ ...contractForm, alert_days_before_expiry: Number(alert_days) })} />
            <Field label="SLA Definition" value={contractForm.sla_definition || ''} onChange={sla_definition => setContractForm({ ...contractForm, sla_definition })} />
            <Select label="Status" value={contractForm.status || 'active'} onChange={status => setContractForm({ ...contractForm, status })} options={['active', 'renewal_due', 'expired', 'terminated']} />
            <TableList 
              rows={contracts} 
              columns={['title', 'agency.name', 'start_date', 'end_date', 'alert_days_before_expiry', 'status']} 
              onDelete={id => submit(() => workforceApi.deleteContract(id), 'Contract removed')} 
              onEdit={row => {
                setEditingId(row.id)
                setContractForm({
                  agency_id: row.agency?.id || row.agency_id || '',
                  title: row.title || '',
                  start_date: formatDate(row.start_date),
                  end_date: formatDate(row.end_date),
                  contract_value: row.contract_value || '',
                  alert_days_before_expiry: row.alert_days_before_expiry || 30,
                  sla_definition: row.sla_definition || '',
                  status: row.status || 'active',
                })
              }}
            />
          </CrudSection>
        )}

        {activeTab === 'Agency Staff' && (
          <CrudSection 
            title={editingId ? "Edit Agency Employee" : "Agency Employee Directory"} 
            isEditing={!!editingId}
            onCancel={() => {
              setEditingId(null)
              setAgencyStaffForm({ status: 'active', gender: '' })
            }}
            onSubmit={() => submit(
              () => editingId ? workforceApi.updateAgencyEmployee(editingId, clean(agencyStaffForm)) : workforceApi.createAgencyEmployee(clean(agencyStaffForm)),
              editingId ? 'Agency staff updated' : 'Agency staff registered',
              () => setAgencyStaffForm({ status: 'active', gender: '' })
            )}
          >
            <Select label="Agency" value={agencyStaffForm.agency_id || ''} onChange={agency_id => setAgencyStaffForm({ ...agencyStaffForm, agency_id })} options={agencies.map(a => ({ value: a.id, label: a.name }))} required />
            <Field label="Employee ID" value={agencyStaffForm.employee_code || ''} onChange={employee_code => setAgencyStaffForm({ ...agencyStaffForm, employee_code })} required />
            <Field label="Full Name" value={agencyStaffForm.full_name || ''} onChange={full_name => setAgencyStaffForm({ ...agencyStaffForm, full_name })} required />
            <Field label="Position" value={agencyStaffForm.position || ''} onChange={position => setAgencyStaffForm({ ...agencyStaffForm, position })} required />
            <Field label="Phone" value={agencyStaffForm.phone || ''} onChange={phone => setAgencyStaffForm({ ...agencyStaffForm, phone })} />
            <Select label="Gender" value={agencyStaffForm.gender || ''} onChange={gender => setAgencyStaffForm({ ...agencyStaffForm, gender })} options={['male', 'female', 'other']} />
            <Field label="National ID Number" value={agencyStaffForm.national_id || ''} onChange={national_id => setAgencyStaffForm({ ...agencyStaffForm, national_id })} />
            <FileInput label="Profile Photo" value={agencyStaffForm.photo_url || ''} onChange={url => setAgencyStaffForm({ ...agencyStaffForm, photo_url: url })} />
            <FileInput label="National ID Document" value={agencyStaffForm.national_id_document_url || ''} onChange={url => setAgencyStaffForm({ ...agencyStaffForm, national_id_document_url: url })} />
            <FileInput label="Medical Certificate" value={agencyStaffForm.medical_certificate_url || ''} onChange={url => setAgencyStaffForm({ ...agencyStaffForm, medical_certificate_url: url })} />
            <FileInput label="Training Certificate" value={agencyStaffForm.training_certificate_url || ''} onChange={url => setAgencyStaffForm({ ...agencyStaffForm, training_certificate_url: url })} />
            <Field label="Start Date" type="date" value={agencyStaffForm.start_date || ''} onChange={start_date => setAgencyStaffForm({ ...agencyStaffForm, start_date })} />
            <Select label="Status" value={agencyStaffForm.status || 'active'} onChange={status => setAgencyStaffForm({ ...agencyStaffForm, status })} options={['active', 'inactive', 'on_leave', 'terminated']} />
            <TableList 
              rows={agencyStaff} 
              columns={['employee_code', 'full_name', 'agency.name', 'position', 'gender', 'photo_url', 'national_id_document_url', 'medical_certificate_url', 'training_certificate_url', 'status']} 
              onDelete={id => submit(() => workforceApi.deleteAgencyEmployee(id), 'Agency staff removed')} 
              onEdit={row => {
                setEditingId(row.id)
                setAgencyStaffForm({
                  agency_id: row.agency?.id || row.agency_id || '',
                  employee_code: row.employee_code || '',
                  full_name: row.full_name || '',
                  position: row.position || '',
                  phone: row.phone || '',
                  gender: row.gender || '',
                  national_id: row.national_id || '',
                  photo_url: row.photo_url || '',
                  national_id_document_url: row.national_id_document_url || '',
                  medical_certificate_url: row.medical_certificate_url || '',
                  training_certificate_url: row.training_certificate_url || '',
                  start_date: formatDate(row.start_date),
                  status: row.status || 'active',
                })
              }}
            />
          </CrudSection>
        )}

        {activeTab === 'Assignments' && (
          <CrudSection 
            title={editingId ? "Edit Building Assignment" : "Building Assignment Management"} 
            isEditing={!!editingId}
            onCancel={() => {
              setEditingId(null)
              setAssignmentForm({ person_type: 'agency', shift: 'morning', is_active: true })
            }}
            onSubmit={() => submit(
              () => editingId ? workforceApi.updateAssignment(editingId, clean(assignmentForm)) : workforceApi.createAssignment(clean(assignmentForm)),
              editingId ? 'Assignment updated' : 'Assignment saved',
              () => setAssignmentForm({ person_type: 'agency', shift: 'morning', is_active: true })
            )}
          >
            <Select label="Staff Type" value={assignmentForm.person_type} onChange={person_type => setAssignmentForm({ ...assignmentForm, person_type, agency_employee_id: '', internal_employee_id: '' })} options={['agency', 'internal']} />
            <Select label="Staff Member" value={assignmentForm.person_type === 'internal' ? assignmentForm.internal_employee_id || '' : assignmentForm.agency_employee_id || ''} onChange={id => setAssignmentForm({ ...assignmentForm, agency_employee_id: assignmentForm.person_type === 'agency' ? id : '', internal_employee_id: assignmentForm.person_type === 'internal' ? id : '' })} options={personOptions.map(p => ({ value: p.id, label: p.label }))} required />
            <Select label="Building" value={assignmentForm.building_id || ''} onChange={building_id => setAssignmentForm({ ...assignmentForm, building_id })} options={buildings.map(b => ({ value: b.id, label: b.name }))} required />
            <Field label="Floor" value={assignmentForm.floor || ''} onChange={floor => setAssignmentForm({ ...assignmentForm, floor })} />
            <Select label="Shift" value={assignmentForm.shift || 'morning'} onChange={shift => setAssignmentForm({ ...assignmentForm, shift })} options={['morning', 'evening', 'night', 'custom']} />
            <Field label="Shift Start" type="time" value={assignmentForm.shift_start || ''} onChange={shift_start => setAssignmentForm({ ...assignmentForm, shift_start })} />
            <Field label="Shift End" type="time" value={assignmentForm.shift_end || ''} onChange={shift_end => setAssignmentForm({ ...assignmentForm, shift_end })} />
            <Field label="Assignment Start Date" type="date" value={assignmentForm.start_date || ''} onChange={start_date => setAssignmentForm({ ...assignmentForm, start_date })} />
            <Field label="Assignment End Date" type="date" value={assignmentForm.end_date || ''} onChange={end_date => setAssignmentForm({ ...assignmentForm, end_date })} />
            <Select 
              label="Assignment Status" 
              value={assignmentForm.is_active === false ? 'false' : 'true'} 
              onChange={val => setAssignmentForm({ ...assignmentForm, is_active: val === 'true' })} 
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' }
              ]} 
            />
            <TableList 
              rows={assignments} 
              columns={['person_type', 'agency_employee.full_name', 'internal_employee.full_name', 'building.name', 'floor', 'shift', 'start_date', 'end_date', 'is_active']} 
              onDelete={id => submit(() => workforceApi.deleteAssignment(id), 'Assignment removed')} 
              onEdit={row => {
                setEditingId(row.id)
                setAssignmentForm({
                  person_type: row.person_type || 'agency',
                  agency_employee_id: row.agency_employee?.id || row.agency_employee_id || '',
                  internal_employee_id: row.internal_employee?.id || row.internal_employee_id || '',
                  building_id: row.building?.id || row.building_id || '',
                  floor: row.floor || '',
                  shift: row.shift || 'morning',
                  shift_start: row.shift_start || '',
                  shift_end: row.shift_end || '',
                  start_date: formatDate(row.start_date),
                  end_date: formatDate(row.end_date),
                  is_active: row.is_active !== false,
                })
              }}
            />
          </CrudSection>
        )}

        {activeTab === 'Attendance' && (
          <Panel title="Attendance Tracking">
            <div className="grid gap-3 md:grid-cols-5">
              <Select label="Staff Type" value={attendanceForm.person_type} onChange={(person_type: WorkforcePersonType) => setAttendanceForm({ ...attendanceForm, person_type, agency_employee_id: '', internal_employee_id: '' })} options={['agency', 'internal']} />
              <Select label="Staff Member" value={attendanceForm.person_type === 'internal' ? attendanceForm.internal_employee_id || '' : attendanceForm.agency_employee_id || ''} onChange={id => setAttendanceForm({ ...attendanceForm, agency_employee_id: attendanceForm.person_type === 'agency' ? id : '', internal_employee_id: attendanceForm.person_type === 'internal' ? id : '' })} options={(attendanceForm.person_type === 'internal' ? internalStaff : agencyStaff).map(e => ({ value: e.id, label: `${e.full_name} - ${e.position}` }))} required />
              <Field label="Date" type="date" value={attendanceForm.attendance_date || ''} onChange={attendance_date => setAttendanceForm({ ...attendanceForm, attendance_date })} />
              <Field label="Attendance Notes" value={attendanceForm.notes || ''} onChange={notes => setAttendanceForm({ ...attendanceForm, notes })} />
              <div className="flex items-end gap-2">
                <button className={buttonClass} onClick={() => submit(() => workforceApi.checkIn(clean(attendanceForm)), 'Checked in')}>Check In</button>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700" onClick={() => submit(() => workforceApi.markAbsent(clean(attendanceForm)), 'Marked absent')}>Absent</button>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
                  <tr><th className="p-3">Date</th><th>Staff</th><th>Status</th><th>Late</th><th>Check In</th><th>Check Out</th><th>Notes</th><th></th></tr>
                </thead>
                <tbody>
                  {attendance.map(row => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="p-3">{row.attendance_date}</td>
                      <td>{staffName(row)}</td>
                      <td><StatusBadge value={row.status} /></td>
                      <td>{row.late_minutes || 0} min</td>
                      <td>{row.check_in_at ? new Date(row.check_in_at).toLocaleTimeString() : '-'}</td>
                      <td>{row.check_out_at ? new Date(row.check_out_at).toLocaleTimeString() : '-'}</td>
                      <td>{row.notes || '-'}</td>
                      <td>{row.check_in_at && !row.check_out_at && <button className="text-indigo-600 font-bold hover:underline" onClick={() => submit(() => workforceApi.checkOut(row.id), 'Checked out')}>Check out</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {activeTab === 'Internal Staff' && (
          <CrudSection 
            title={editingId ? "Edit Internal Employee" : "Internal Employee Management"} 
            isEditing={!!editingId}
            onCancel={() => {
              setEditingId(null)
              setInternalForm({ status: 'active', gender: '', annual_leave_balance: 20 })
            }}
            onSubmit={() => submit(
              () => editingId ? workforceApi.updateInternalEmployee(editingId, clean(internalForm)) : workforceApi.createInternalEmployee(clean(internalForm)),
              editingId ? 'Internal employee updated' : 'Internal employee registered',
              () => setInternalForm({ status: 'active', gender: '', annual_leave_balance: 20 })
            )}
          >
            <Field label="Employee ID" value={internalForm.employee_code || ''} onChange={employee_code => setInternalForm({ ...internalForm, employee_code })} required />
            <Field label="Full Name" value={internalForm.full_name || ''} onChange={full_name => setInternalForm({ ...internalForm, full_name })} required />
            <Field label="Position" value={internalForm.position || ''} onChange={position => setInternalForm({ ...internalForm, position })} required />
            <Field label="Email" value={internalForm.email || ''} onChange={email => setInternalForm({ ...internalForm, email })} />
            <Field label="Phone" value={internalForm.phone || ''} onChange={phone => setInternalForm({ ...internalForm, phone })} />
            <Select label="Gender" value={internalForm.gender || ''} onChange={gender => setInternalForm({ ...internalForm, gender })} options={['male', 'female', 'other']} />
            <Field label="Emergency Contact Name" value={internalForm.emergency_contact_name || ''} onChange={emergency_contact_name => setInternalForm({ ...internalForm, emergency_contact_name })} />
            <Field label="Emergency Contact Phone" value={internalForm.emergency_contact_phone || ''} onChange={emergency_contact_phone => setInternalForm({ ...internalForm, emergency_contact_phone })} />
            <Field label="National ID Number" value={internalForm.national_id || ''} onChange={national_id => setInternalForm({ ...internalForm, national_id })} />
            <FileInput label="National ID Document" value={internalForm.national_id_document_url || ''} onChange={url => setInternalForm({ ...internalForm, national_id_document_url: url })} />
            <Field label="Start Date" type="date" value={internalForm.start_date || ''} onChange={start_date => setInternalForm({ ...internalForm, start_date })} />
            <Field label="Leave Balance" type="number" value={internalForm.annual_leave_balance || 20} onChange={annual_leave_balance => setInternalForm({ ...internalForm, annual_leave_balance: Number(annual_leave_balance) })} />
            <Select label="Status" value={internalForm.status || 'active'} onChange={status => setInternalForm({ ...internalForm, status })} options={['active', 'inactive', 'on_leave', 'terminated']} />
            <TableList 
              rows={internalStaff} 
              columns={['employee_code', 'full_name', 'position', 'phone', 'gender', 'emergency_contact_name', 'emergency_contact_phone', 'national_id_document_url', 'start_date', 'annual_leave_balance', 'status']} 
              onDelete={id => submit(() => workforceApi.deleteInternalEmployee(id), 'Internal employee removed')} 
              onEdit={row => {
                setEditingId(row.id)
                setInternalForm({
                  employee_code: row.employee_code || '',
                  full_name: row.full_name || '',
                  position: row.position || '',
                  email: row.email || '',
                  phone: row.phone || '',
                  gender: row.gender || '',
                  emergency_contact_name: row.emergency_contact_name || '',
                  emergency_contact_phone: row.emergency_contact_phone || '',
                  national_id: row.national_id || '',
                  national_id_document_url: row.national_id_document_url || '',
                  start_date: formatDate(row.start_date),
                  annual_leave_balance: row.annual_leave_balance || 20,
                  status: row.status || 'active',
                })
              }}
            />
          </CrudSection>
        )}

        {activeTab === 'Leave' && (
          <CrudSection title="Leave Management" onSubmit={() => submit(() => workforceApi.createLeave(clean(leaveForm)), 'Leave request created', () => setLeaveForm({ leave_type: 'annual' }))}>
            <Select label="Employee" value={leaveForm.employee_id || ''} onChange={employee_id => setLeaveForm({ ...leaveForm, employee_id })} options={internalStaff.map(e => ({ value: e.id, label: `${e.full_name} - balance ${e.annual_leave_balance}` }))} required />
            <Select label="Leave Type" value={leaveForm.leave_type || 'annual'} onChange={leave_type => setLeaveForm({ ...leaveForm, leave_type })} options={['annual', 'sick', 'emergency', 'unpaid']} />
            <Field label="Start Date" type="date" value={leaveForm.start_date || ''} onChange={start_date => setLeaveForm({ ...leaveForm, start_date })} required />
            <Field label="End Date" type="date" value={leaveForm.end_date || ''} onChange={end_date => setLeaveForm({ ...leaveForm, end_date })} required />
            <Field label="Reason" value={leaveForm.reason || ''} onChange={reason => setLeaveForm({ ...leaveForm, reason })} />
            <div className="md:col-span-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
                  <tr><th className="p-3">Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th>Decision Note</th><th></th></tr>
                </thead>
                <tbody>
                  {leaves.map(row => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="p-3">{row.employee?.full_name}</td>
                      <td>{row.leave_type}</td>
                      <td>{row.start_date} to {row.end_date}</td>
                      <td>{row.days}</td>
                      <td>{row.reason || '-'}</td>
                      <td><StatusBadge value={row.status} /></td>
                      <td>{row.decision_note || '-'}</td>
                      <td className="p-3">
                        {row.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              placeholder="Decision note..." 
                              value={decisionNotes[row.id] || ''} 
                              onChange={e => setDecisionNotes({ ...decisionNotes, [row.id]: e.target.value })} 
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            <button className="text-emerald-700 font-bold text-xs hover:underline" onClick={() => submit(() => workforceApi.decideLeave(row.id, { status: 'approved', decision_note: decisionNotes[row.id] }), 'Leave approved', () => setDecisionNotes({ ...decisionNotes, [row.id]: '' }))}>Approve</button>
                            <button className="text-rose-700 font-bold text-xs hover:underline" onClick={() => submit(() => workforceApi.decideLeave(row.id, { status: 'rejected', decision_note: decisionNotes[row.id] }), 'Leave rejected', () => setDecisionNotes({ ...decisionNotes, [row.id]: '' }))}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CrudSection>
        )}
      </div>
    </PageLayout>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>{children}</div>
}

function CrudSection({ 
  title, 
  children, 
  onSubmit, 
  isEditing, 
  onCancel 
}: { 
  title: string; 
  children: React.ReactNode; 
  onSubmit: () => void;
  isEditing?: boolean;
  onCancel?: () => void;
}) {
  const childArray = React.Children.toArray(children)
  const formItems = childArray.slice(0, -1)
  const list = childArray.slice(-1)
  return (
    <div className="space-y-5">
      <Panel title={title}>
        <form onSubmit={e => { e.preventDefault(); onSubmit() }} className="grid gap-3 md:grid-cols-3">
          {formItems}
          <div className="flex items-end gap-2">
            <button className={buttonClass} type="submit">
              {isEditing ? 'Save Changes' : <><Plus size={16} /> Add</>}
            </button>
            {isEditing && onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Panel>
      {list}
    </div>
  )
}

function FileInput({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const toast = useToast()
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    setUploading(true)
    try {
      const res = await api.post('/upload/image?type=misc', fd)
      onChange(res.data.path)
      toast.addToast('Document uploaded successfully', 'success')
    } catch (err: any) {
      toast.addToast(err?.response?.data?.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
      {label}
      <div 
        onClick={() => fileRef.current?.click()} 
        className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <input 
          type="file" 
          accept="image/*" 
          ref={fileRef} 
          onChange={handleUpload} 
          className="hidden" 
        />
        {uploading ? (
          <span className="text-slate-400">Uploading...</span>
        ) : value ? (
          <span className="text-emerald-600 font-bold truncate">✓ Uploaded</span>
        ) : (
          <span className="text-slate-400">Click to upload image</span>
        )}
        <Upload size={16} className="text-slate-400" />
      </div>
    </label>
  )
}

function Field({ label, value, onChange, type = 'text', required }: any) {
  return <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">{label}<input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} mt-1`} /></label>
}

function Select({ label, value, onChange, options, required }: any) {
  const normalized = options.map((option: any) => typeof option === 'string' ? { value: option, label: option } : option)
  return <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">{label}<select required={required} value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} mt-1`}><option value="">Select</option>{normalized.map((option: any) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function TableList({ 
  rows, 
  columns, 
  onDelete, 
  onEdit 
}: { 
  rows: any[]; 
  columns: string[]; 
  onDelete: (id: string) => void;
  onEdit?: (row: any) => void;
}) {
  function value(row: any, path: string) {
    return path.split('.').reduce((acc, part) => acc?.[part], row)
  }
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9888'
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
          <tr>
            {columns.map(col => <th key={col} className="p-3">{col.replace('.', ' ').replace('_url', '')}</th>)}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-t border-slate-100 dark:border-slate-700">
              {columns.map(col => {
                const val = value(row, col)
                const isPath = typeof val === 'string' && val.startsWith('/')
                return (
                  <td key={col} className="p-3">
                    {isPath ? (
                      <a 
                        href={`${API_BASE}${val}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        View File
                      </a>
                    ) : typeof val === 'boolean' ? (
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-bold ${val ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {val ? 'Yes' : 'No'}
                      </span>
                    ) : (
                      String(val ?? '-')
                    )}
                  </td>
                )
              })}
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(row)} 
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  )}
                  <button 
                    onClick={() => onDelete(row.id)} 
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="p-6 text-center text-sm font-semibold text-slate-400">
                No records yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: any) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><Icon className="mb-3 text-indigo-600" size={22} /><div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div><div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div></div>
}

function WorkflowStep({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20"><div className="font-bold text-indigo-900 dark:text-indigo-400">{title}</div><div className="mt-1 text-sm text-indigo-800 dark:text-slate-300">{text}</div></div>
}

function StatusBadge({ value }: { value: string }) {
  const good = ['active', 'present', 'approved']
  const bad = ['inactive', 'absent', 'rejected', 'expired', 'terminated']
  const Icon = good.includes(value) ? CheckCircle2 : bad.includes(value) ? XCircle : Clock
  const color = good.includes(value) ? 'bg-emerald-50 text-emerald-700' : bad.includes(value) ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${color}`}><Icon size={12} />{value}</span>
}
