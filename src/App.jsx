
import React, { useState, useEffect, useRef } from 'react';
// Assume icon library like Font Awesome or a custom SVG component library is available
// For this exercise, we'll use simple text/emoji or placeholder spans.

// --- ROLES and RBAC Configuration ---
const ROLES = {
  ADMIN: 'Admin',
  ADMISSION_OFFICER: 'Admission Officer',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  ACADEMIC_COORDINATOR: 'Academic Coordinator',
};

const USER_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canViewDashboard: true,
    canManageStudents: true,
    canManageAdmissions: true,
    canManageCourses: true,
    canEditAll: true,
    canApprove: true,
    canViewAuditLogs: true,
    canExportData: true,
    canBulkActions: true,
  },
  [ROLES.ADMISSION_OFFICER]: {
    canViewDashboard: true,
    canManageStudents: true, // Specifically admissions-related student records
    canManageAdmissions: true,
    canManageCourses: false,
    canEditAll: true, // For admissions data
    canApprove: true, // For admissions
    canViewAuditLogs: true, // Admissions related
    canExportData: true,
    canBulkActions: true,
  },
  [ROLES.TEACHER]: {
    canViewDashboard: true, // For their courses/students
    canManageStudents: true, // View student details, performance
    canManageCourses: true, // Manage their own courses
    canEditAll: true, // For grades, attendance in their courses
    canApprove: false,
    canViewAuditLogs: false,
    canExportData: true,
    canBulkActions: false,
  },
  [ROLES.STUDENT]: {
    canViewDashboard: true, // Personal dashboard
    canManageStudents: false, // View own record
    canManageAdmissions: false,
    canManageCourses: true, // View enrolled courses
    canEditAll: false,
    canApprove: false,
    canViewAuditLogs: false,
    canExportData: false,
    canBulkActions: false,
  },
  [ROLES.ACADEMIC_COORDINATOR]: {
    canViewDashboard: true,
    canManageStudents: true,
    canManageAdmissions: true,
    canManageCourses: true,
    canEditAll: true,
    canApprove: true, // Curriculum, course changes
    canViewAuditLogs: true,
    canExportData: true,
    canBulkActions: true,
  },
};

// --- Global Constants & Mappings ---
const STATUS_COLORS_MAP = {
  APPROVED: 'approved',
  'IN PROGRESS': 'in-progress',
  PENDING: 'pending',
  REJECTED: 'rejected',
  EXCEPTION: 'exception',
  ENROLLED: 'approved', // Student status
  ACTIVE: 'in-progress', // Course status
  GRADUATED: 'approved',
  DROPPED: 'rejected',
};

const SCREEN_MAP = {
  DASHBOARD: 'DASHBOARD',
  STUDENT_LIST: 'STUDENT_LIST',
  STUDENT_DETAIL: 'STUDENT_DETAIL',
  ADMISSION_FORM: 'ADMISSION_FORM',
  COURSE_LIST: 'COURSE_LIST',
  // ... potentially more screens
  NOT_FOUND: 'NOT_FOUND',
};

// --- Mock Data Generation ---
const generateMockData = () => {
  const students = Array.from({ length: 15 }, (_, i) => ({
    id: `STU${1001 + i}`,
    studentId: `S${1001 + i}`,
    name: `Student Name ${i + 1}`,
    email: `student${i + 1}@example.com`,
    major: ['Computer Science', 'Biology', 'History', 'Physics', 'Arts'][i % 5],
    status: ['ENROLLED', 'IN PROGRESS', 'GRADUATED', 'DROPPED'][i % 4],
    currentGPA: (3.0 + (i * 0.1) % 1).toFixed(2),
    attendanceRate: (75 + (i * 2) % 25).toFixed(0),
    enrollmentDate: new Date(2020 + (i % 3), (i % 12), (i % 28) + 1).toISOString().split('T')[0],
    workflowStageId: `STAGE_ENROLLMENT_${i % 3 + 1}`, // For milestone tracking
    lastActivity: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(`Student Name ${i + 1}`)}`,
  }));

  const courses = Array.from({ length: 10 }, (_, i) => ({
    id: `CRS${201 + i}`,
    name: `Introduction to ${['AI', 'Biology', 'World History', 'Quantum Physics', 'Digital Art'][i % 5]}`,
    code: `CS${101 + i}`,
    credits: (3 + (i % 2)),
    department: ['CS', 'BIO', 'HIS', 'PHY', 'ART'][i % 5],
    status: ['ACTIVE', 'PENDING', 'COMPLETED'][i % 3],
  }));

  const admissions = Array.from({ length: 8 }, (_, i) => ({
    id: `ADM${301 + i}`,
    applicantName: `Applicant ${i + 1}`,
    programApplied: ['Computer Science', 'Biology', 'History'][i % 3],
    status: ['PENDING', 'APPROVED', 'REJECTED', 'IN PROGRESS'][i % 4],
    submittedDate: new Date(2023, (i % 12), (i % 28) + 1).toISOString().split('T')[0],
    workflowStageId: `STAGE_ADMISSION_${i % 3 + 1}`,
    email: `applicant${i + 1}@example.com`,
  }));

  const activityLog = Array.from({ length: 20 }, (_, i) => ({
    id: `ACT${i}`,
    userId: `USR${1 + (i % 5)}`,
    userName: ['Admin', 'Admissions Officer', 'Teacher', 'Student', 'Coordinator'][i % 5],
    action: ['created', 'updated', 'approved', 'rejected', 'enrolled', 'graded'][i % 6],
    timestamp: new Date(Date.now() - (i * 1000 * 60 * 60 * 24)).toISOString(),
    recordType: ['Student', 'Admission', 'Course'][i % 3],
    recordId: `STU${1001 + (i % students.length)}`, // Example, could be other records
    details: `Record ${['STU', 'ADM', 'CRS'][i % 3]}${1001 + (i % 10)} was ${['created', 'updated', 'approved', 'rejected', 'enrolled', 'graded'][i % 6]} by ${['Admin', 'Admissions Officer', 'Teacher', 'Student', 'Coordinator'][i % 5]}.`,
  }));

  return { students, courses, admissions, activityLog };
};

// --- Reusable UI Components ---

const Icon = ({ name, className = '' }) => {
  // A simple placeholder for icons
  const icons = {
    dashboard: '📊', student: '🎓', course: '📚', admission: '📝',
    search: '🔍', bell: '🔔', user: '👤', cog: '⚙️',
    plus: '+', edit: '✍️', eye: '👁️', trash: '🗑️', download: '⬇️',
    check: '✓', arrowUp: '↑', arrowDown: '↓',
    file: '📄', // For documents or empty states
    warning: '⚠️',
  };
  return <span className={`icon icon-${name} ${className}`}>{icons[name] || ''}</span>;
};

const Button = ({ children, onClick, variant = 'primary', disabled = false, icon, className = '' }) => (
  <button
    className={`btn btn--${variant} ${className}`}
    onClick={onClick}
    disabled={disabled}
    style={{
      marginBottom: 'var(--spacing-xs)', // Example for JSX style syntax rule
      borderRadius: 'var(--border-radius-sm)',
    }}
  >
    {icon && <Icon name={icon} />}
    {children}
  </button>
);

const InputField = ({ label, type = 'text', name, value, onChange, placeholder, required = false, error, disabled = false, autoPopulate = false, autoPopulateText = '' }) => (
  <div className="form-group">
    <label htmlFor={name}>
      {label} {required && <span style={{ color: 'var(--status-rejected-border)' }}>*</span>}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="input-field"
      style={{
        padding: 'var(--spacing-sm) var(--spacing-md)',
      }}
    />
    {autoPopulate && autoPopulateText && (
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
        <Icon name="cog" /> Automatically populated: {autoPopulateText}
      </p>
    )}
    {error && <p className="error-message">{error}</p>}
  </div>
);

const FileUpload = ({ label, name, onFileUpload, fileName, error }) => (
  <div className="form-group">
    <label htmlFor={name}>{label}</label>
    <div className="file-upload-area" onClick={() => document.getElementById(name).click()}>
      <input type="file" id={name} name={name} onChange={onFileUpload} />
      <p>Drag & drop file here or click to browse</p>
      {fileName && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-main)' }}>Selected: {fileName}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusClass = STATUS_COLORS_MAP[status.toUpperCase()] || 'outline';
  return (
    <span className={`status-tag status-tag--${statusClass}`}
      style={{
        borderRadius: 'var(--border-radius-sm)',
      }}
    >
      {status}
    </span>
  );
};

const Card = ({ children, onClick, className = '' }) => (
  <div className={`card ${className}`} onClick={onClick}>
    {children}
  </div>
);

const EmptyState = ({ title, description, icon = 'file', actionText, onAction }) => (
  <div className="empty-state">
    <div className="empty-state__icon"><Icon name={icon} /></div>
    <h3 className="empty-state__title">{title}</h3>
    <p className="empty-state__description">{description}</p>
    {onAction && <Button onClick={onAction} variant="primary">{actionText}</Button>}
  </div>
);

const MilestoneTracker = ({ stages, currentStageId }) => (
  <Card className="milestone-tracker">
    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Workflow Progress</h3>
    {stages.map((stage, index) => {
      const isCompleted = stage.order < stages.find(s => s.id === currentStageId)?.order;
      const isCurrent = stage.id === currentStageId;
      return (
        <div key={stage.id} className={`milestone-tracker__step ${isCompleted ? 'milestone-tracker__step--completed' : ''}`}>
          <div className={`milestone-tracker__step-indicator ${isCompleted ? 'milestone-tracker__step-indicator--completed' : ''} ${isCurrent ? 'milestone-tracker__step-indicator--current' : ''}`}>
            {isCompleted ? <Icon name="check" /> : index + 1}
          </div>
          <div className="milestone-tracker__step-line" style={{ height: `calc(100% + var(--spacing-md))` }}></div> {/* Extend line */}
          <span className="milestone-tracker__step-label">{stage.name}</span>
          {isCompleted && stage.date && <span className="milestone-tracker__step-date">{stage.date}</span>}
          {isCurrent && <span className="status-tag status-tag--in-progress" style={{ marginLeft: 'auto', borderRadius: 'var(--border-radius-sm)' }}>Current</span>}
        </div>
      );
    })}
  </Card>
);

const ActivityFeed = ({ activities, title = "Recent Activities" }) => (
  <Card className="activity-feed">
    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>{title}</h3>
    {activities.length > 0 ? (
      activities.map((activity) => (
        <div key={activity.id} className="activity-item">
          <div className="activity-item__icon">
            <Icon name={activity.recordType?.toLowerCase() || 'file'} />
          </div>
          <div className="activity-item__content">
            <p style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-md)', color: 'var(--text-main)' }}>
              <strong>{activity.userName}</strong> {activity.action} {activity.recordType} <strong>{activity.recordId}</strong>
            </p>
            <p className="activity-item__meta">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))
    ) : (
      <EmptyState title="No Activities Yet" description="This feed will show recent actions." icon="bell" />
    )}
  </Card>
);

const ChartComponent = ({ title, type, data, options }) => (
  <Card className="chart-container">
    <h3 style={{ position: 'absolute', top: 'var(--spacing-md)', left: 'var(--spacing-lg)', marginBottom: 0 }}>{title}</h3>
    {/* In a real app, this would render a charting library like Chart.js or Recharts */}
    <p>Placeholder for a {type} chart visualizing "{title}"</p>
  </Card>
);

// --- Screen Components ---

const DashboardScreen = ({ navigateTo, currentUserPermissions, mockData }) => {
  const { students, admissions, courses, activityLog } = mockData;

  const totalStudents = students.length;
  const activeCourses = courses.filter(c => c.status === 'ACTIVE').length;
  const pendingAdmissions = admissions.filter(a => a.status === 'PENDING').length;
  const avgAttendance = (students.reduce((sum, s) => sum + parseInt(s.attendanceRate || 0), 0) / students.length).toFixed(0);

  const admissionChartData = {
    labels: ['Pending', 'Approved', 'Rejected', 'In Progress'],
    datasets: [{
      data: [
        admissions.filter(a => a.status === 'PENDING').length,
        admissions.filter(a => a.status === 'APPROVED').length,
        admissions.filter(a => a.status === 'REJECTED').length,
        admissions.filter(a => a.status === 'IN PROGRESS').length,
      ],
      backgroundColor: ['var(--status-pending-border)', 'var(--status-approved-border)', 'var(--status-rejected-border)', 'var(--status-in-progress-border)'],
    }],
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Dashboard Overview</h2>

      <div className="grid-4-col" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Card className="kpi-card live-pulse">
          <p className="kpi-card__label">Total Students</p>
          <p className="kpi-card__value">{totalStudents}</p>
          <div className="kpi-card__trend"><Icon name="arrowUp" /> 5% last month</div>
        </Card>
        <Card className="kpi-card live-pulse">
          <p className="kpi-card__label">Active Courses</p>
          <p className="kpi-card__value">{activeCourses}</p>
          <div className="kpi-card__trend"><Icon name="arrowUp" /> 2 new this semester</div>
        </Card>
        <Card className="kpi-card live-pulse">
          <p className="kpi-card__label">Pending Admissions</p>
          <p className="kpi-card__value">{pendingAdmissions}</p>
          <div className="kpi-card__trend kpi-card__trend--negative"><Icon name="arrowDown" /> 10% last week</div>
        </Card>
        <Card className="kpi-card live-pulse">
          <p className="kpi-card__label">Avg. Attendance Rate</p>
          <p className="kpi-card__value">{avgAttendance}%</p>
          <div className="kpi-card__trend"><Icon name="arrowUp" /> 1% last month</div>
        </Card>
      </div>

      <div className="grid-2-col" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <ChartComponent title="Student Performance (GPA Distribution)" type="bar" data={{}} />
        <ChartComponent title="Admission Status Breakdown" type="donut" data={admissionChartData} />
      </div>

      <ActivityFeed activities={activityLog} title="Global Audit & News Feed" />
    </div>
  );
};

const StudentCard = ({ student, onClick, currentUserPermissions, onEdit, onDelete }) => {
  const latestActivity = mockData.activityLog
    .filter(a => a.recordType === 'Student' && a.recordId === student.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  return (
    <Card onClick={() => onClick(student.id)} className="flex-column"
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--border-radius-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <img src={student.image} alt={student.name} style={{ width: '48px', height: '48px', borderRadius: '50%', marginRight: 'var(--spacing-md)' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{student.name}</h3>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{student.major} ({student.studentId})</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={student.status} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
        <p>GPA: <strong>{student.currentGPA}</strong></p>
        <p>Attendance: <strong>{student.attendanceRate}%</strong></p>
      </div>
      {latestActivity && (
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
          Last updated: {new Date(latestActivity.timestamp).toLocaleDateString()}
        </p>
      )}
      {currentUserPermissions.canEditAll && ( // Example of hover actions
        <div style={{
          position: 'absolute', top: 'var(--spacing-sm)', right: 'var(--spacing-sm)',
          display: 'flex', gap: 'var(--spacing-xs)', opacity: 0, transition: 'opacity 0.2s ease',
        }} className="card__hover-actions">
          <Button icon="edit" onClick={(e) => { e.stopPropagation(); onEdit(student.id); }} variant="icon" />
          <Button icon="trash" onClick={(e) => { e.stopPropagation(); onDelete(student.id); }} variant="icon" />
        </div>
      )}
    </Card>
  );
};

const StudentListScreen = ({ navigateTo, currentUserPermissions, mockData }) => {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [savedViews, setSavedViews] = useState([]); // Mock saved views
  const { students } = mockData;

  const handleSearchChange = (e) => setFilter(e.target.value);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(filter.toLowerCase()) ||
    student.major.toLowerCase().includes(filter.toLowerCase()) ||
    student.studentId.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
    if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleStudentSelect = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (actionType) => {
    alert(`Performing bulk action "${actionType}" on ${selectedStudents.length} students.`);
    setSelectedStudents([]);
  };

  const handleSaveView = () => {
    const viewName = prompt("Enter a name for this view:");
    if (viewName) {
      setSavedViews(prev => [...prev, { name: viewName, filter, sortKey, sortOrder }]);
      alert(`View "${viewName}" saved!`);
    }
  };

  const handleExport = (format) => {
    alert(`Exporting ${filteredStudents.length} students to ${format}.`);
  };

  const handleEditStudent = (id) => {
    navigateTo(SCREEN_MAP.ADMISSION_FORM, { studentId: id }); // Re-use form for edit example
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm(`Are you sure you want to delete student ${id}?`)) {
      // Logic to delete student from mockData.students (using immutability)
      mockData.students = mockData.students.filter(s => s.id !== id);
      alert(`Student ${id} deleted.`);
      navigateTo(SCREEN_MAP.STUDENT_LIST); // Refresh list
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Student Management</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <InputField
          type="text"
          placeholder="Search students by name, major, ID..."
          value={filter}
          onChange={handleSearchChange}
          style={{ flexGrow: 1, marginRight: 'var(--spacing-md)' }}
        />
        <Button variant="outline" onClick={() => alert('Opening filter side panel...')} className="btn--icon" icon="cog">Filters</Button>
        <Button variant="outline" onClick={handleSaveView} className="btn--icon" icon="plus">Save View</Button>
        <Button variant="primary" onClick={() => navigateTo(SCREEN_MAP.ADMISSION_FORM)} className="btn--icon" icon="plus">Add New Student</Button>
      </div>

      {savedViews.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-accent)' }}>Saved Views:</p>
          {savedViews.map((view, index) => (
            <Button key={index} variant="secondary" onClick={() => {
              setFilter(view.filter);
              setSortKey(view.sortKey);
              setSortOrder(view.sortOrder);
            }}>{view.name}</Button>
          ))}
        </div>
      )}

      {currentUserPermissions.canBulkActions && selectedStudents.length > 0 && (
        <Card className="glassmorphism" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{selectedStudents.length} students selected.</span>
          <div>
            <Button variant="secondary" onClick={() => handleBulkAction('enroll')} style={{ marginRight: 'var(--spacing-sm)' }}>Bulk Enroll</Button>
            <Button variant="secondary" onClick={() => handleBulkAction('update status')}>Update Status</Button>
            {currentUserPermissions.canExportData && <Button variant="secondary" onClick={() => handleBulkAction('export')} icon="download" style={{ marginLeft: 'var(--spacing-sm)' }}>Export Selected</Button>}
          </div>
        </Card>
      )}

      {sortedStudents.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description="Try adjusting your search or filters, or add a new student."
          actionText="Add New Student"
          onAction={() => navigateTo(SCREEN_MAP.ADMISSION_FORM)}
        />
      ) : (
        <div className="grid-3-col">
          {sortedStudents.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={(id) => navigateTo(SCREEN_MAP.STUDENT_DETAIL, { studentId: id })}
              currentUserPermissions={currentUserPermissions}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
            />
          ))}
        </div>
      )}

      {currentUserPermissions.canExportData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)', gap: 'var(--spacing-sm)' }}>
          <Button variant="outline" onClick={() => handleExport('PDF')} icon="download">Export to PDF</Button>
          <Button variant="outline" onClick={() => handleExport('Excel')} icon="download">Export to Excel</Button>
        </div>
      )}
    </div>
  );
};


const StudentDetailScreen = ({ navigateTo, currentUserPermissions, params, mockData }) => {
  const studentId = params.studentId;
  const student = mockData.students.find(s => s.id === studentId);

  if (!student) {
    return (
      <div className="container">
        <EmptyState title="Student Not Found" description="The requested student record does not exist." icon="warning" />
        <div className="text-center" style={{ marginTop: 'var(--spacing-lg)' }}>
          <Button onClick={() => navigateTo(SCREEN_MAP.STUDENT_LIST)} variant="secondary">Back to Student List</Button>
        </div>
      </div>
    );
  }

  // Mock workflow stages for a student's academic journey
  const studentWorkflowStages = [
    { id: 'STAGE_ENROLLMENT_1', name: 'Admission Confirmed', order: 1, date: student.enrollmentDate },
    { id: 'STAGE_ENROLLMENT_2', name: 'Course Registration', order: 2, date: new Date(new Date(student.enrollmentDate).setMonth(new Date(student.enrollmentDate).getMonth() + 1)).toISOString().split('T')[0] },
    { id: 'STAGE_ENROLLMENT_3', name: 'First Semester Completed', order: 3, date: new Date(new Date(student.enrollmentDate).setMonth(new Date(student.enrollmentDate).getMonth() + 4)).toISOString().split('T')[0] },
    { id: 'STAGE_ENROLLMENT_4', name: 'Mid-Degree Review', order: 4, date: null },
    { id: 'STAGE_ENROLLMENT_5', name: 'Graduation Eligible', order: 5, date: null },
    { id: 'STAGE_ENROLLMENT_6', name: 'Graduated', order: 6, date: null },
  ];

  const studentAuditLog = mockData.activityLog.filter(log => log.recordType === 'Student' && log.recordId === student.id);

  const handleEdit = () => {
    if (currentUserPermissions.canEditAll) {
      navigateTo(SCREEN_MAP.ADMISSION_FORM, { studentId: student.id, mode: 'edit' });
    } else {
      alert("You don't have permission to edit this record.");
    }
  };

  const handleExportTranscript = () => {
    alert(`Exporting transcript for ${student.name}`);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ margin: 0 }}>{student.name} <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)', fontWeight: 'normal' }}>({student.studentId})</span></h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {currentUserPermissions.canEditAll && <Button onClick={handleEdit} variant="primary" icon="edit">Edit Student</Button>}
          {currentUserPermissions.canExportData && <Button onClick={handleExportTranscript} variant="outline" icon="download">Export Transcript</Button>}
        </div>
      </div>

      <div className="record-summary-layout">
        <div className="record-summary__main">
          <Card className="card--elevated">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Summary Information</h3>
            <div className="grid-2-col" style={{ gap: 'var(--spacing-md)' }}>
              <div><p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-accent)', fontWeight: 500 }}>Email:</p> <p>{student.email}</p></div>
              <div><p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-accent)', fontWeight: 500 }}>Major:</p> <p>{student.major}</p></div>
              <div><p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-accent)', fontWeight: 500 }}>Enrollment Date:</p> <p>{student.enrollmentDate}</p></div>
              <div><p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-accent)', fontWeight: 500 }}>Current Status:</p> <p><StatusBadge status={student.status} /></p></div>
              <div><p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-accent)', fontWeight: 500 }}>GPA:</p> <p>{student.currentGPA}</p></div>
              <div><p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-accent)', fontWeight: 500 }}>Attendance Rate:</p> <p>{student.attendanceRate}%</p></div>
            </div>
            {/* Related records example */}
            <div style={{ marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-lg)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Enrolled Courses</h4>
              {mockData.courses.filter(c => c.id.includes(student.major.substring(0, 3).toUpperCase())).map(course => ( // Simplified relation
                <Card key={course.id} onClick={() => alert(`View course ${course.name}`)}
                  style={{
                    padding: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)',
                    boxShadow: 'none', border: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: 'var(--border-radius-md)',
                  }}>
                  <span>{course.name} ({course.code}) - {course.credits} Credits</span>
                  <StatusBadge status={course.status} />
                </Card>
              ))}
            </div>
          </Card>

          {/* Document Preview Placeholder */}
          <Card className="card--elevated">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Academic Documents</h3>
            <div className="chart-container" style={{ minHeight: '200px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--border-radius-md)' }}>
              <p>Document preview for {student.name}'s transcript. <Icon name="file" /></p>
            </div>
            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" icon="download">Download All Documents</Button>
            </div>
          </Card>

        </div>

        <div className="record-summary__sidebar">
          <MilestoneTracker stages={studentWorkflowStages} currentStageId={student.workflowStageId} />
          {currentUserPermissions.canViewAuditLogs && <ActivityFeed activities={studentAuditLog} title="Student Audit Feed" />}
        </div>
      </div>
    </div>
  );
};

const AdmissionFormScreen = ({ navigateTo, currentUserPermissions, params, mockData, setMockData }) => {
  const studentId = params.studentId;
  const isEditMode = params.mode === 'edit' && studentId;
  const existingStudent = isEditMode ? mockData.students.find(s => s.id === studentId) : null;

  const initialFormState = {
    name: existingStudent?.name || '',
    studentId: existingStudent?.studentId || `S${Math.floor(Math.random() * 10000)}`,
    email: existingStudent?.email || '',
    major: existingStudent?.major || '',
    status: existingStudent?.status || 'PENDING',
    currentGPA: existingStudent?.currentGPA || '0.00',
    attendanceRate: existingStudent?.attendanceRate || '0',
    enrollmentDate: existingStudent?.enrollmentDate || '',
    applicationFile: null,
    applicationFileName: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && !existingStudent) {
      alert("Student record not found for editing.");
      navigateTo(SCREEN_MAP.STUDENT_LIST);
    } else if (isEditMode && existingStudent) {
      setFormData({
        name: existingStudent.name || '',
        studentId: existingStudent.studentId || '',
        email: existingStudent.email || '',
        major: existingStudent.major || '',
        status: existingStudent.status || 'ENROLLED',
        currentGPA: existingStudent.currentGPA || '0.00',
        attendanceRate: existingStudent.attendanceRate || '0',
        enrollmentDate: existingStudent.enrollmentDate || '',
        applicationFile: null,
        applicationFileName: 'existing_application.pdf', // Placeholder for existing file
      });
    }
  }, [isEditMode, existingStudent, studentId, navigateTo]);

  const validateForm = () => {
    let errors = {};
    if (!formData.name.trim()) errors.name = 'Student Name is mandatory.';
    if (!formData.email.trim()) errors.email = 'Email is mandatory.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid.';
    if (!formData.major.trim()) errors.major = 'Major is mandatory.';
    if (!formData.enrollmentDate.trim()) errors.enrollmentDate = 'Enrollment Date is mandatory.';
    if (!isEditMode && !formData.applicationFile) errors.applicationFile = 'Application file is required for new admissions.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, applicationFile: file, applicationFileName: file.name }));
      setFormErrors(prev => ({ ...prev, applicationFile: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      alert(`Student record ${isEditMode ? 'updated' : 'created'} successfully!`);

      const newRecord = {
        ...formData,
        id: existingStudent?.id || `STU${Math.floor(Math.random() * 100000)}`,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name)}`,
        lastActivity: new Date().toISOString(),
        // Workflow stage for new admissions, if applicable
        workflowStageId: isEditMode ? existingStudent?.workflowStageId : 'STAGE_ENROLLMENT_1',
      };

      setMockData(prevData => {
        if (isEditMode) {
          return {
            ...prevData,
            students: prevData.students.map(s => s.id === newRecord.id ? newRecord : s),
            activityLog: [{
              id: `ACT${prevData.activityLog.length}`,
              userId: 'USR_CURRENT', userName: currentUserPermissions.user,
              action: 'updated', timestamp: new Date().toISOString(),
              recordType: 'Student', recordId: newRecord.id,
              details: `Student ${newRecord.name} details updated.`,
            }, ...prevData.activityLog],
          };
        } else {
          return {
            ...prevData,
            students: [...prevData.students, newRecord],
            activityLog: [{
              id: `ACT${prevData.activityLog.length}`,
              userId: 'USR_CURRENT', userName: currentUserPermissions.user,
              action: 'created', timestamp: new Date().toISOString(),
              recordType: 'Student', recordId: newRecord.id,
              details: `New student ${newRecord.name} admitted.`,
            }, ...prevData.activityLog],
          };
        }
      });

      setIsSubmitting(false);
      navigateTo(SCREEN_MAP.STUDENT_DETAIL, { studentId: newRecord.id });
    }, 1500);
  };

  if (!currentUserPermissions.canManageStudents) {
    return (
      <div className="container">
        <EmptyState title="Access Denied" description="You do not have permission to manage student records." icon="warning" />
        <div className="text-center" style={{ marginTop: 'var(--spacing-lg)' }}>
          <Button onClick={() => navigateTo(SCREEN_MAP.DASHBOARD)} variant="secondary">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>{isEditMode ? `Edit Student: ${existingStudent?.name}` : 'New Student Admission'}</h2>
      <Card className="card--elevated" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <InputField label="Student Name" name="name" value={formData.name} onChange={handleChange} required error={formErrors.name} />
          <InputField label="Student ID" name="studentId" value={formData.studentId} disabled autoPopulate autoPopulateText="Automatically generated" />
          <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required error={formErrors.email} />
          <InputField label="Major" name="major" value={formData.major} onChange={handleChange} required error={formErrors.major} />
          <InputField label="Enrollment Date" type="date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleChange} required error={formErrors.enrollmentDate} />
          <InputField label="Current GPA" type="number" name="currentGPA" value={formData.currentGPA} onChange={handleChange} disabled={!isEditMode} />
          <InputField label="Attendance Rate (%)" type="number" name="attendanceRate" value={formData.attendanceRate} onChange={handleChange} disabled={!isEditMode} />

          {!isEditMode && <FileUpload label="Upload Application File" name="applicationFile" onFileUpload={handleFileUpload} fileName={formData.applicationFileName} error={formErrors.applicationFile} />}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
            <Button type="button" onClick={() => navigateTo(SCREEN_MAP.STUDENT_LIST)} variant="outline">Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Student' : 'Admit Student')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};


const NotFoundScreen = ({ navigateTo }) => (
  <div className="container text-center">
    <h1 style={{ fontSize: '5rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>404</h1>
    <h2>Page Not Found</h2>
    <p style={{ marginBottom: 'var(--spacing-lg)' }}>The screen you're looking for doesn't exist.</p>
    <Button onClick={() => navigateTo(SCREEN_MAP.DASHBOARD)} variant="primary">Go to Dashboard</Button>
  </div>
);


function App() {
  const [view, setView] = useState({ screen: SCREEN_MAP.DASHBOARD, params: {} });
  const [currentUserRole, setCurrentUserRole] = useState(ROLES.ADMIN); // Default to Admin for full demo
  const [mockData, setMockData] = useState(generateMockData());

  const currentUserPermissions = USER_PERMISSIONS[currentUserRole];

  const navigateTo = (screen, params = {}) => {
    setView({ screen, params });
  };

  const renderScreen = () => {
    switch (view.screen) {
      case SCREEN_MAP.DASHBOARD:
        return <DashboardScreen navigateTo={navigateTo} currentUserPermissions={currentUserPermissions} mockData={mockData} />;
      case SCREEN_MAP.STUDENT_LIST:
        return <StudentListScreen navigateTo={navigateTo} currentUserPermissions={currentUserPermissions} mockData={mockData} setMockData={setMockData} />;
      case SCREEN_MAP.STUDENT_DETAIL:
        return <StudentDetailScreen navigateTo={navigateTo} currentUserPermissions={currentUserPermissions} params={view.params} mockData={mockData} />;
      case SCREEN_MAP.ADMISSION_FORM:
        return <AdmissionFormScreen navigateTo={navigateTo} currentUserPermissions={currentUserPermissions} params={view.params} mockData={mockData} setMockData={setMockData} />;
      // Add other screens here (e.g., COURSE_LIST)
      default:
        return <NotFoundScreen navigateTo={navigateTo} />;
    }
  };

  // Mock Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchTimeoutRef = useRef(null);

  const handleGlobalSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (query.length > 2) {
        const results = [];
        mockData.students.forEach(s => {
          if (s.name.toLowerCase().includes(query.toLowerCase()) || s.studentId.toLowerCase().includes(query.toLowerCase())) {
            results.push({ type: 'Student', id: s.id, name: s.name, targetScreen: SCREEN_MAP.STUDENT_DETAIL });
          }
        });
        mockData.admissions.forEach(a => {
          if (a.applicantName.toLowerCase().includes(query.toLowerCase()) || a.programApplied.toLowerCase().includes(query.toLowerCase())) {
            results.push({ type: 'Admission', id: a.id, name: a.applicantName, targetScreen: SCREEN_MAP.ADMISSION_FORM }); // Using AdmissionForm as detail page
          }
        });
        setSearchResults(results.slice(0, 5)); // Limit suggestions
      } else {
        setSearchResults([]);
      }
    }, 300);
  };

  const handleSelectSearchResult = (result) => {
    setSearchQuery('');
    setSearchResults([]);
    navigateTo(result.targetScreen, { studentId: result.id }); // Assuming studentId as generic ID param
  };

  const getBreadcrumbs = () => {
    const path = [];
    path.push({ label: 'Home', screen: SCREEN_MAP.DASHBOARD });

    switch (view.screen) {
      case SCREEN_MAP.STUDENT_LIST:
        path.push({ label: 'Students', screen: SCREEN_MAP.STUDENT_LIST });
        break;
      case SCREEN_MAP.STUDENT_DETAIL:
        path.push({ label: 'Students', screen: SCREEN_MAP.STUDENT_LIST });
        const student = mockData.students.find(s => s.id === view.params?.studentId);
        if (student) path.push({ label: student.name, screen: SCREEN_MAP.STUDENT_DETAIL, params: view.params });
        break;
      case SCREEN_MAP.ADMISSION_FORM:
        path.push({ label: 'Students', screen: SCREEN_MAP.STUDENT_LIST });
        if (view.params?.mode === 'edit') {
          const editedStudent = mockData.students.find(s => s.id === view.params?.studentId);
          if (editedStudent) path.push({ label: `Edit ${editedStudent.name}`, screen: SCREEN_MAP.ADMISSION_FORM, params: view.params });
          else path.push({ label: 'Edit Student', screen: SCREEN_MAP.ADMISSION_FORM, params: view.params });
        } else {
          path.push({ label: 'New Admission', screen: SCREEN_MAP.ADMISSION_FORM });
        }
        break;
      // Add other screen breadcrumbs
      default:
        // For Dashboard or unhandled screens, only Home
        break;
    }
    return path;
  };

  return (
    <div className="App">
      <header className="header">
        <div className="header__logo">AMS</div>
        <nav className="header__nav">
          {currentUserPermissions.canViewDashboard && (
            <a onClick={() => navigateTo(SCREEN_MAP.DASHBOARD)} className={view.screen === SCREEN_MAP.DASHBOARD ? 'header__nav-item--active' : 'header__nav-item'}>
              <Icon name="dashboard" /> Dashboard
            </a>
          )}
          {currentUserPermissions.canManageStudents && (
            <a onClick={() => navigateTo(SCREEN_MAP.STUDENT_LIST)} className={view.screen === SCREEN_MAP.STUDENT_LIST || view.screen === SCREEN_MAP.STUDENT_DETAIL || view.screen === SCREEN_MAP.ADMISSION_FORM ? 'header__nav-item--active' : 'header__nav-item'}>
              <Icon name="student" /> Students
            </a>
          )}
          {currentUserPermissions.canManageCourses && (
             <a onClick={() => alert('Course List')} className={'header__nav-item'}> {/* Placeholder */}
             <Icon name="course" /> Courses
           </a>
          )}
        </nav>
        <div className="header__actions">
          <div className="global-search">
            <input
              type="text"
              className="global-search__input"
              placeholder="Global Search (Students, Courses, Admissions...)"
              value={searchQuery}
              onChange={handleGlobalSearch}
              style={{
                borderRadius: searchResults.length > 0 ? 'var(--border-radius-sm) var(--border-radius-sm) 0 0' : 'var(--border-radius-sm)',
              }}
            />
            {searchResults.length > 0 && (
              <div className="global-search__suggestions">
                {searchResults.map((result, index) => (
                  <div key={index} className="global-search__suggestion-item" onClick={() => handleSelectSearchResult(result)}>
                    <Icon name={result.type?.toLowerCase()} style={{ marginRight: 'var(--spacing-sm)' }} />
                    {result.name} ({result.type})
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button variant="icon" icon="bell" onClick={() => alert('Show Notifications')} />
          <Button variant="icon" icon="user" onClick={() => alert('User Profile / Settings')}>
            {currentUserRole}
          </Button>
        </div>
      </header>

      <div className="breadcrumbs">
        {getBreadcrumbs().map((crumb, index, arr) => (
          <React.Fragment key={crumb.label}>
            <a onClick={() => navigateTo(crumb.screen, crumb.params)}>{crumb.label}</a>
            {index < arr.length - 1 && <span>/</span>}
          </React.Fragment>
        ))}
      </div>

      <main style={{ flexGrow: 1, padding: 'var(--spacing-lg) 0' }}>
        {renderScreen()}
      </main>
    </div>
  );
}

export default App;