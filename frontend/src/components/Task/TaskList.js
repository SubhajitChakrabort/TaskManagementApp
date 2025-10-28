import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../../services/api';
import './TaskList.css';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1
  });

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput
      }));
      // Reset to page 1 when search changes
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const params = {
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          search: filters.search || undefined,
          page: pagination.page,
          limit: pagination.limit,
        };
        const { data } = await taskAPI.getTasks(params);
        setTasks(data.data || []);
        
        // Update pagination info
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.count || 0,
            totalPages: Math.ceil((data.count || 0) / prev.limit)
          }));
        }
      } catch (err) {
        setError('Failed to fetch tasks');
        console.error('Error fetching tasks:', err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [filters.status, filters.priority, filters.search, pagination.page, pagination.limit]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.deleteTask(id);
        setTasks(tasks.filter(task => task._id !== id));
      } catch (err) {
        setError('Failed to delete task');
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'search') {
      setSearchInput(value);
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
      // Reset to page 1 when filters change
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(1)}
          disabled={pagination.page === 1}
          className="pagination-btn"
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className="pagination-number">
              1
            </button>
            {startPage > 2 && <span className="pagination-dots">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`pagination-number ${pagination.page === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}

        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && <span className="pagination-dots">...</span>}
            <button onClick={() => handlePageChange(pagination.totalPages)} className="pagination-number">
              {pagination.totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="pagination-btn"
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.page === pagination.totalPages}
          className="pagination-btn"
        >
          Last
        </button>
      </div>
    );
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in-progress':
        return 'status-in-progress';
      case 'pending':
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h2>My Tasks</h2>
        <Link to="/tasks/new" className="btn btn-primary">
          + New Task
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="form-control"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="form-control"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group search-box">
          <input
            type="text"
            name="search"
            value={searchInput}
            onChange={handleFilterChange}
            placeholder="Search tasks..."
            className="form-control"
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="no-tasks">
          <p>No tasks found. Create your first task!</p>
          <Link to="/tasks/new" className="btn btn-primary">
            + Create Task
          </Link>
        </div>
      ) : (
        <>
          <div className="task-count">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
          </div>
          
          <div className="task-grid">
            {tasks.map((task) => (
              <div key={task._id} className="task-card">
                <div className="task-card-header">
                  <h3>{task.title}</h3>
                  <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                <div className="task-card-body">
                  <p className="task-description">
                    {task.description?.substring(0, 100)}{task.description?.length > 100 ? '...' : ''}
                  </p>
                  
                  <div className="task-meta">
                    <span className={`status-badge ${getStatusClass(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                    
                    {task.dueDate && (
                      <span className="due-date">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="task-card-actions">
                  <Link to={`/tasks/${task._id}`} className="btn btn-sm btn-edit">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="btn btn-sm btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default TaskList;
