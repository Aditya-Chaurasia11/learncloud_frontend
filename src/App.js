import React, { Component, useEffect, useState } from "react";
import {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
} from "./services/taskServices";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Paper, TextField, Checkbox, Button } from "@material-ui/core";
import "./App.css";
import axios from "axios";

class App extends Component {
  state = {
    tasks: [],
    currentTask: "",
  };

  async componentDidMount() {
    try {
      const { data } = await getTasks();
      this.setState({ tasks: data });
    } catch (error) {
      console.log(error);
    }
  }

  handleChange = ({ currentTarget: input }) => {
    this.setState({ currentTask: input.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { currentTask, tasks } = this.state;

    try {
      const position = tasks.length; // Assign position based on the number of tasks
      const { data } = await addTask({
        task: currentTask,
        position: position, // Include the 'position' field when adding a task
      });

      this.setState((prevState) => ({
        tasks: [...prevState.tasks, data],
        currentTask: "",
      }));
    } catch (error) {
      console.log(error);
    }
  };

  handleUpdate = async (currentTask) => {
    const originalTasks = this.state.tasks;
    try {
      const tasks = [...originalTasks];
      const index = tasks.findIndex((task) => task._id === currentTask);
      tasks[index] = { ...tasks[index] };
      tasks[index].completed = !tasks[index].completed;
      this.setState({ tasks });
      await updateTask(currentTask, {
        completed: tasks[index].completed,
      });
    } catch (error) {
      this.setState({ tasks: originalTasks });
      console.log(error);
    }
  };

  handleDelete = async (currentTask) => {
    const originalTasks = this.state.tasks;
    try {
      const tasks = originalTasks.filter((task) => task._id !== currentTask);
      this.setState({ tasks });
      await deleteTask(currentTask);
    } catch (error) {
      this.setState({ tasks: originalTasks });
      console.log(error);
    }
  };

  onDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const tasks = Array.from(this.state.tasks);
    const [reorderedItem] = tasks.splice(result.source.index, 1);
    tasks.splice(result.destination.index, 0, reorderedItem);

    this.setState({ tasks });

    try {
      // Prepare the data to send to the backend (tasks with updated positions)
      const updatedTasks = tasks.map((task, index) => ({
        ...task,
        position: index, // Assign the new position to each task
      }));

      // Make an API call to update task positions on the backend
      await axios.put(
        "https://xyz-9nky.onrender.com/api/tasks/updatePositions",
        updatedTasks
      );
    } catch (error) {
      console.log(error);
      // Handle error appropriately
    }

    // Update backend with new task order
    // Make an API call here to update task positions in your database
  };

  render() {
    return (
      <div className="App flex">
        <Paper elevation={3} className="container">
          <div className="heading">TO-DO</div>
          <form
            onSubmit={this.handleSubmit}
            className="flex"
            style={{ margin: "15px 0" }}
          >
            <TextField
              variant="outlined"
              size="small"
              style={{ width: "80%" }}
              value={this.state.currentTask}
              required={true}
              onChange={this.handleChange}
              placeholder="Add New TO-DO"
            />
            <Button
              style={{ height: "40px" }}
              color="primary"
              variant="outlined"
              type="submit"
            >
              Add task
            </Button>
          </form>
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {this.state.tasks.map((task, index) => (
                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Paper className="flex task_container">
                            <Checkbox
                              checked={task.completed}
                              onClick={() => this.handleUpdate(task._id)}
                              color="primary"
                            />
                            <div
                              className={
                                task.completed ? "task line_through" : "task"
                              }
                            >
                              {task.task}
                            </div>
                            <Button
                              onClick={() => this.handleDelete(task._id)}
                              color="secondary"
                            >
                              delete
                            </Button>
                          </Paper>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Paper>
      </div>
    );
  }
}

export default App;
