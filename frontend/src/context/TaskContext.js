import React, { createContext, useState, useContext, useEffect } from 'react';
import { taskAPI } from '../services/api';

const TaskContext = createContext();

export const useTasks = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Fetch tasks
  const fetchTasks = async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(true);
      const params = { page, limit, ...filters };
      const { data } = await taskAPI.getTasks(params);
      
      setTasks(data.data);
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      });
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const createTask = async (taskData) => {
    try {
      const { data } = await taskAPI.createTask(taskData);
      // Refresh tasks after creation
      await fetchTasks(pagination.page, pagination.limit);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to create task',
      };
    }
  };

  // Update task
  const updateTask = async (id, taskData) => {
    try {
      const { data } = await taskAPI.updateTask(id, taskData);
      // Refresh tasks after update
      await fetchTasks(pagination.page, pagination.limit);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to update task',
      };
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      await taskAPI.deleteTask(id);
      // Refresh tasks after deletion
      await fetchTasks(pagination.page, pagination.limit);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to delete task',
      };
    }
  };

  // Change page
  const changePage = (newPage) => {
    return fetchTasks(newPage, pagination.limit);
  };

  const value = {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    changePage,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;
