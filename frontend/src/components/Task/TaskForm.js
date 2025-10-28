import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taskAPI } from '../../services/api';
import './TaskForm.css';

const TaskForm = () => {
  const [task, setTask] = useState({
    title: '',
    description: '',
    status: 'pending',
    dueDate: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      const fetchTask = async () => {
        try {
          setLoading(true);
          const { data } = await taskAPI.getTask(id);
          const taskData = data.data || data;
          setTask({
            title: taskData.title,
            description: taskData.description || '',
            status: taskData.status,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
            priority: taskData.priority || 'medium',
          });
        } catch (err) {
          setError('Failed to fetch task');
          console.error('Error fetching task:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchTask();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        await taskAPI.updateTask(id, task);
      } else {
        await taskAPI.createTask(task);
      }
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      console.error('Error saving task:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div className="loading">Loading task...</div>;
  }

  return (
    <div className="task-form-container">
      <h2>{isEditMode ? 'Edit Task' : 'Create New Task'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={task.title}
            onChange={handleChange}
            required
            className="form-control"
            placeholder="Enter task title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={task.description}
            onChange={handleChange}
            className="form-control"
            rows="4"
            placeholder="Enter task description"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={task.status}
              onChange={handleChange}
              className="form-control"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={task.priority}
              onChange={handleChange}
              className="form-control"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={task.dueDate}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
