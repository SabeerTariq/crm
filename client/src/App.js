import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import ScheduleList from './pages/ScheduleList';
import Customers from './pages/Customers';
import CustomerSalesProfile from './pages/CustomerSalesProfile';
import Sales from './pages/Sales';
import Users from './pages/Users';
import Roles from './pages/Roles';
import LeadScraperDashboard from './pages/LeadScraperDashboard';
import FrontSellerDashboard from './pages/FrontSellerDashboard';
import UpsellerDashboard from './pages/UpsellerDashboard';
import UpsellManagerDashboard from './pages/UpsellManagerDashboard';
import FrontSalesManagerDashboard from './pages/FrontSalesManagerDashboard';
import ProductionHeadDashboard from './pages/ProductionHeadDashboard';
import DepartmentLeaderDashboard from './pages/DepartmentLeaderDashboard';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import UpsellerTeams from './pages/UpsellerTeams';
import UpsellerTargets from './pages/UpsellerTargets';
import UpsellerPerformance from './pages/UpsellerPerformance';
import Teams from './pages/Teams';
import Targets from './pages/Targets';
import Performance from './pages/Performance';
import Payments from './pages/Payments';
import Assignments from './pages/Assignments';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Departments from './pages/Departments';
import TaskManagement from './pages/TaskManagement';
import Calendar from './pages/Calendar';
import ChargebackRefunds from './pages/ChargebackRefunds';
import Chat from './pages/Chat';
import Backup from './pages/Backup';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute module="admin_dashboard" action="view">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/leads" element={
          <ProtectedRoute module="leads">
            <Leads />
          </ProtectedRoute>
        } />
        <Route path="/schedule-list" element={
          <ProtectedRoute module="schedule-list" action="read">
            <ScheduleList />
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute module="customers">
            <Customers />
          </ProtectedRoute>
        } />
        <Route path="/customers/:customerId/sales-profile" element={
          <ProtectedRoute module="customers">
            <CustomerSalesProfile />
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute module="sales">
            <Sales />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute module="users">
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/roles" element={
          <ProtectedRoute module="roles">
            <Roles />
          </ProtectedRoute>
        } />
        <Route path="/lead-scraper-dashboard" element={
          <ProtectedRoute module="lead_scraper_dashboard" action="view">
            <LeadScraperDashboard />
          </ProtectedRoute>
        } />
        <Route path="/front-seller-dashboard" element={
          <ProtectedRoute module="front_seller_dashboard" action="view">
            <FrontSellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/upseller-dashboard" element={
          <ProtectedRoute module="upseller_dashboard" action="view">
            <UpsellerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/upsell-manager-dashboard" element={
          <ProtectedRoute module="upsell_manager_dashboard" action="view">
            <UpsellManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/front-sales-manager-dashboard" element={
          <ProtectedRoute module="front_sales_manager_dashboard" action="view">
            <FrontSalesManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/production-head-dashboard" element={
          <ProtectedRoute module="production_head_dashboard" action="view">
            <ProductionHeadDashboard />
          </ProtectedRoute>
        } />
        <Route path="/department-leader-dashboard/:departmentId" element={
          <ProtectedRoute module="department_leader_dashboard" action="view">
            <DepartmentLeaderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/team-member-dashboard" element={
          <ProtectedRoute module="team_member_dashboard" action="view">
            <TeamMemberDashboard />
          </ProtectedRoute>
        } />
        <Route path="/upseller-teams" element={
          <ProtectedRoute module="upseller_teams" action="view">
            <UpsellerTeams />
          </ProtectedRoute>
        } />
        <Route path="/upseller-targets" element={
          <ProtectedRoute module="upseller_targets" action="view">
            <UpsellerTargets />
          </ProtectedRoute>
        } />
        <Route path="/upseller-performance" element={
          <ProtectedRoute module="upseller_performance" action="view">
            <UpsellerPerformance />
          </ProtectedRoute>
        } />
        <Route path="/teams" element={
          <ProtectedRoute module="teams">
            <Teams />
          </ProtectedRoute>
        } />
        <Route path="/targets" element={
          <ProtectedRoute module="targets">
            <Targets />
          </ProtectedRoute>
        } />
        <Route path="/performance" element={
          <ProtectedRoute module="targets">
            <Performance />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute module="payments">
            <Payments />
          </ProtectedRoute>
        } />
        <Route path="/assignments" element={
          <ProtectedRoute module="assignments">
            <Assignments />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute module="projects">
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute module="projects">
            <ProjectDetails />
          </ProtectedRoute>
        } />
        <Route path="/departments" element={
          <ProtectedRoute module="departments">
            <Departments />
          </ProtectedRoute>
        } />
        <Route path="/task-management" element={
          <ProtectedRoute module="tasks">
            <TaskManagement />
          </ProtectedRoute>
        } />
        <Route path="/task-management/board/:boardId" element={
          <ProtectedRoute module="tasks">
            <TaskManagement />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute module="reminders">
            <Calendar />
          </ProtectedRoute>
        } />
        <Route path="/chargeback-refunds" element={
          <ProtectedRoute module="chargeback_refunds" action="view">
            <ChargebackRefunds />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute module="chat" action="view">
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/backup" element={
          <ProtectedRoute module="backup" action="view">
            <Backup />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
