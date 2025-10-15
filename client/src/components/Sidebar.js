import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useUserBoards } from '../hooks/useUserBoards';
import { hasLeadScraperRole, hasSalesRole, hasUpsellerRole, hasUpsellerManagerRole, isAdmin } from '../utils/roleUtils';
import { getUserName, getUserRole } from '../utils/userUtils';
import './Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, loading } = usePermissions();
  const { boards: userBoards, loading: boardsLoading } = useUserBoards();
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    console.log('Toggling sidebar, current state:', isOpen, 'isMobile:', isMobile);
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleMenuClick = () => {
    console.log('Menu clicked - isMobile:', isMobile, 'isOpen:', isOpen, 'isCollapsed:', isCollapsed);
    if (isMobile) {
      setIsOpen(false);
    }
    // On desktop, do nothing - sidebar should stay in its current state
  };

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isSubmenuExpanded = (menuKey) => {
    return expandedMenus[menuKey] || false;
  };

  // Handle window resize and initial state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        setIsCollapsed(false);
      } else {
        setIsOpen(true);
        // Keep collapsed state on desktop
      }
    };

    // Set initial state
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    if (mobile) {
      setIsOpen(false);
      setIsCollapsed(false);
    } else {
      setIsOpen(true);
      setIsCollapsed(false);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set initial CSS custom property
  useEffect(() => {
    // Set initial value
    document.documentElement.style.setProperty('--sidebar-width', '280px');
  }, []);

  // Update CSS custom property for sidebar width
  useEffect(() => {
    const updateSidebarWidth = () => {
      let width;
      if (isMobile) {
        // On mobile, sidebar is hidden when closed
        width = isOpen ? '280px' : '0px';
      } else {
        // On desktop, sidebar is always visible but can be collapsed
        width = isCollapsed ? '70px' : '280px';
      }
      
      console.log('Setting sidebar width:', { isMobile, isOpen, isCollapsed, width });
      document.documentElement.style.setProperty('--sidebar-width', width);
    };

    updateSidebarWidth();
  }, [isOpen, isCollapsed, isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isOpen && !event.target.closest('.sidebar') && !event.target.closest('.hamburger-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen]);

  if (loading) {
    return (
      <>
        {/* Hamburger Menu Button */}
        <button className="hamburger-menu" onClick={toggleSidebar}>
          <i className={`fas ${isMobile ? (isOpen ? 'fa-times' : 'fa-bars') : (isCollapsed ? 'fa-bars' : 'fa-times')}`}></i>
        </button>
        
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <div className="company-logo">
              <div className="logo-icon">CRM</div>
              <div className="company-name">LogicWorks</div>
            </div>
            {(!isCollapsed || isMobile) && (
              <button className="close-sidebar" onClick={isMobile ? toggleSidebar : () => setIsCollapsed(true)}>
                <i className="fas fa-bars"></i>
              </button>
            )}
          </div>
          <div className="user-info">
            <div className="user-avatar">
              <div className="avatar-placeholder">L</div>
            </div>
            <div className="user-details">
              <div className="user-name">Loading...</div>
              <div className="user-role">Loading...</div>
            </div>
          </div>
          <ul className="sidebar-menu">
            <li className="menu-item loading">Loading permissions...</li>
          </ul>
        </div>
        
        {/* Overlay for mobile */}
        {isMobile && isOpen && <div className="sidebar-overlay" onClick={handleMenuClick}></div>}
      </>
    );
  }

  return (
    <>
      {/* Hamburger Menu Button */}
      {/*<button className="hamburger-menu" onClick={toggleSidebar}>
        <i className={`fas ${isMobile ? (isOpen ? 'fa-times' : 'fa-bars') : (isCollapsed ? 'fa-bars' : 'fa-times')}`}></i>
      </button>*/}
      
      <div className={`sidebar ${isOpen ? 'open' : 'closed'} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Company Logo Section */}
        <div className="sidebar-header">
          <div className="company-logo">
            <div className="logo-container">
              <img 
                src="/crm-logo.png" 
                alt="CRM Logo" 
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="logo-icon" style={{ display: 'none' }}>CRM</div>
            </div>
            {!isCollapsed && <div className="company-name">LogicWorks</div>}
          </div>
          <button className="close-sidebar" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
        </div>

      {/* User Info Section */}
      <div className="user-info">
        <div className="user-avatar">
          <div className="avatar-placeholder">{getUserName().charAt(0).toUpperCase()}</div>
        </div>
        {!isCollapsed && (
          <div className="user-details">
            <div className="user-name">{getUserName()}</div>
            <div className="user-role">{getUserRole()}</div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <ul className="sidebar-menu">
        {isAdmin() && (
          <li className={`menu-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <Link to="/dashboard" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-tachometer-alt menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Main Dashboard</span>}
            </Link>
          </li>
        )}
        {hasLeadScraperRole() && (
          <li className={`menu-item ${isActive('/lead-scraper-dashboard') ? 'active' : ''}`}>
            <Link to="/lead-scraper-dashboard" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-chart-line menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Dashboard</span>}
            </Link>
          </li>
        )}
        {hasSalesRole() && (
          <li className={`menu-item ${isActive('/front-seller-dashboard') ? 'active' : ''}`}>
            <Link to="/front-seller-dashboard" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-briefcase menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Dashboard</span>}
            </Link>
          </li>
        )}
        {hasUpsellerRole() && (
          <li className={`menu-item ${isActive('/upseller-dashboard') ? 'active' : ''}`}>
            <Link to="/upseller-dashboard" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-bullseye menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Dashboard</span>}
            </Link>
          </li>
        )}
        {hasUpsellerManagerRole() && (
          <li className={`menu-item ${isActive('/upsell-manager-dashboard') ? 'active' : ''}`}>
            <Link to="/upsell-manager-dashboard" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-chart-line menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Manager Dashboard</span>}
            </Link>
          </li>
        )}
        {hasPermission('leads', 'view') && (
          <li className={`menu-item ${isActive('/leads') ? 'active' : ''}`}>
            <Link to="/leads" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-users menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Leads</span>}
            </Link>
          </li>
        )}
        {hasPermission('leads', 'view') && (
          <li className={`menu-item ${isActive('/schedule-list') ? 'active' : ''}`}>
            <Link to="/schedule-list" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-calendar-alt menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Schedule List</span>}
            </Link>
          </li>
        )}
        {hasPermission('customers', 'view') && (
          <li className={`menu-item ${isActive('/customers') ? 'active' : ''}`}>
            <Link to="/customers" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-user menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Customers</span>}
            </Link>
          </li>
        )}
        {hasPermission('sales', 'view') && (
          <li className={`menu-item ${isActive('/sales') ? 'active' : ''}`}>
            <Link to="/sales" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-dollar-sign menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Sales</span>}
            </Link>
          </li>
        )}
        {hasPermission('payments', 'view') && (
          <li className={`menu-item ${isActive('/payments') ? 'active' : ''}`}>
            <Link to="/payments" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-credit-card menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Payments</span>}
            </Link>
          </li>
        )}
        {hasPermission('assignments', 'view') && (
          <li className={`menu-item ${isActive('/assignments') ? 'active' : ''}`}>
            <Link to="/assignments" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-link menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Customer Assignments</span>}
            </Link>
          </li>
        )}
        {hasPermission('projects', 'view') && (
          <li className={`menu-item ${isActive('/projects') ? 'active' : ''}`}>
            <Link to="/projects" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-project-diagram menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Projects</span>}
            </Link>
          </li>
        )}
        {hasPermission('departments', 'view') && (
          <li className={`menu-item ${isActive('/departments') ? 'active' : ''}`}>
            <Link to="/departments" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-building menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Departments</span>}
            </Link>
          </li>
        )}
        {hasPermission('reminders', 'view') && (
          <li className={`menu-item ${isActive('/calendar') ? 'active' : ''}`}>
            <Link to="/calendar" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-calendar-alt menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Calendar</span>}
            </Link>
          </li>
        )}
        {hasPermission('tasks', 'view') && (
          <li className={`menu-item ${isActive('/task-management') || location.pathname.startsWith('/task-management/board/') ? 'active' : ''}`}>
            <div 
              className="menu-link" 
              onClick={() => {
                if (!isCollapsed) {
                  toggleSubmenu('taskManagement');
                } else {
                  // If collapsed, navigate to main task management page
                  navigate('/task-management');
                  handleMenuClick();
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <i className="fas fa-tasks menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Task Management</span>}
              {!isCollapsed && (
                <i className={`fas fa-chevron-${isSubmenuExpanded('taskManagement') ? 'up' : 'down'} menu-chevron`}></i>
              )}
            </div>
            {!isCollapsed && isSubmenuExpanded('taskManagement') && (
              <ul className="submenu">
                <li className="submenu-item">
                  <Link 
                    to="/task-management" 
                    className={`submenu-link ${isActive('/task-management') && !location.pathname.startsWith('/task-management/board/') ? 'active' : ''}`}
                    onClick={handleMenuClick}
                  >
                    <i className="fas fa-th-large submenu-icon"></i>
                    <span>All Boards</span>
                  </Link>
                </li>
                {boardsLoading ? (
                  <li className="submenu-item loading">
                    <span>Loading boards...</span>
                  </li>
                ) : (
                  userBoards.map(board => (
                    <li key={board.id} className="submenu-item">
                      <Link 
                        to={`/task-management/board/${board.id}`}
                        className={`submenu-link ${location.pathname === `/task-management/board/${board.id}` ? 'active' : ''}`}
                        onClick={handleMenuClick}
                      >
                        <i className="fas fa-columns submenu-icon"></i>
                        <span>{board.board_name}</span>
                        {board.is_default && (
                          <span className="default-badge">Default</span>
                        )}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </li>
        )}
        {(() => {
          const hasUsersView = hasPermission('users', 'view');
          return hasUsersView && (
            <li className={`menu-item ${isActive('/users') ? 'active' : ''}`}>
              <Link to="/users" className="menu-link" onClick={handleMenuClick}>
                <i className="fas fa-users menu-icon"></i>
                {!isCollapsed && <span className="menu-text">Users</span>}
              </Link>
            </li>
          );
        })()}
        {(() => {
          const hasRolesView = hasPermission('roles', 'view');
          return hasRolesView && (
            <li className={`menu-item ${isActive('/roles') ? 'active' : ''}`}>
              <Link to="/roles" className="menu-link" onClick={handleMenuClick}>
                <i className="fas fa-shield-alt menu-icon"></i>
                {!isCollapsed && <span className="menu-text">Roles</span>}
              </Link>
            </li>
          );
        })()}
        {hasPermission('teams', 'view') && (
          <li className={`menu-item ${isActive('/teams') ? 'active' : ''}`}>
            <Link to="/teams" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-users-cog menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Teams</span>}
            </Link>
          </li>
        )}
        {hasPermission('targets', 'view') && (
          <li className={`menu-item ${isActive('/targets') ? 'active' : ''}`}>
            <Link to="/targets" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-bullseye menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Targets</span>}
            </Link>
          </li>
        )}
        {hasPermission('performance', 'view') && (
          <li className={`menu-item ${isActive('/performance') ? 'active' : ''}`}>
            <Link to="/performance" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-chart-bar menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Performance</span>}
            </Link>
          </li>
        )}
        {hasPermission('upseller_teams', 'view') && (
          <li className={`menu-item ${isActive('/upseller-teams') ? 'active' : ''}`}>
            <Link to="/upseller-teams" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-user-friends menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Upseller Teams</span>}
            </Link>
          </li>
        )}
        {hasPermission('upseller_targets', 'view') && (
          <li className={`menu-item ${isActive('/upseller-targets') ? 'active' : ''}`}>
            <Link to="/upseller-targets" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-crosshairs menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Upseller Targets</span>}
            </Link>
          </li>
        )}
        {hasPermission('upseller_performance', 'view') && (
          <li className={`menu-item ${isActive('/upseller-performance') ? 'active' : ''}`}>
            <Link to="/upseller-performance" className="menu-link" onClick={handleMenuClick}>
              <i className="fas fa-chart-line menu-icon"></i>
              {!isCollapsed && <span className="menu-text">Upseller Performance</span>}
            </Link>
          </li>
        )}
        
        {/* Logout Button */}
        <li className="menu-item logout-item">
          <button onClick={logout} className="menu-link logout-btn">
            <i className="fas fa-sign-out-alt menu-icon"></i>
            {!isCollapsed && <span className="menu-text">Logout</span>}
          </button>
        </li>
      </ul>
      </div>
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={handleMenuClick}></div>}
    </>
  );
}
