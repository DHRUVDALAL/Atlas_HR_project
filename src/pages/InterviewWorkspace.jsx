import React, { useState } from 'react';
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const initialData = {
  columns: {
    'applied': { id: 'applied', title: 'Applied', taskIds: ['c1', 'c2'] },
    'screening': { id: 'screening', title: 'HR Screening', taskIds: ['c3'] },
    'tech1': { id: 'tech1', title: 'Technical R1', taskIds: ['c4', 'c5'] },
    'hr_round': { id: 'hr_round', title: 'HR Round', taskIds: ['c6'] },
    'offered': { id: 'offered', title: 'Selected / Offered', taskIds: [] },
  },
  columnOrder: ['applied', 'screening', 'tech1', 'hr_round', 'offered'],
  tasks: {
    'c1': { id: 'c1', name: 'John Doe', role: 'Frontend Dev', exp: '3y' },
    'c2': { id: 'c2', name: 'Jane Smith', role: 'Backend Dev', exp: '5y' },
    'c3': { id: 'c3', name: 'Alice Walker', role: 'UI/UX', exp: '2y' },
    'c4': { id: 'c4', name: 'Bob Brown', role: 'DevOps', exp: '4y' },
    'c5': { id: 'c5', name: 'Charlie Davis', role: 'Frontend Dev', exp: '1y' },
    'c6': { id: 'c6', name: 'Eve Johnson', role: 'Backend Dev', exp: '6y' },
  }
};

const InterviewWorkspace = () => {
  const [data, setData] = useState(initialData);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      const newColumn = { ...start, taskIds: newTaskIds };
      setData(prev => ({ ...prev, columns: { ...prev.columns, [newColumn.id]: newColumn } }));
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    setData(prev => ({
      ...prev,
      columns: { ...prev.columns, [newStart.id]: newStart, [newFinish.id]: newFinish }
    }));
  };

  return (
    <Box className="animate-fade-in" sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" fontWeight="800" mb={3}>Interview Pipeline</Typography>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', flexGrow: 1, pb: 2 }}>
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

            return (
              <Box key={column.id} sx={{ minWidth: 300, width: 300, display: 'flex', flexDirection: 'column' }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'action.hover', borderTop: '4px solid #3B82F6', borderRadius: '8px 8px 0 0' }}>
                  <Typography fontWeight="800" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {column.title} <Chip size="small" label={tasks.length} sx={{ fontWeight: 800 }} />
                  </Typography>
                </Paper>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        flexGrow: 1,
                        bgcolor: snapshot.isDraggingOver ? 'action.selected' : 'action.hover',
                        p: 1, borderRadius: 2, minHeight: 200, transition: 'background-color 0.2s ease'
                      }}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              elevation={snapshot.isDragging ? 4 : 0}
                              sx={{
                                p: 2, mb: 1.5, borderRadius: 2, border: 1, borderColor: 'divider',
                                bgcolor: 'background.paper', '&:hover': { borderColor: 'primary.main' }
                              }}
                            >
                              <Typography fontWeight="700" mb={1}>{task.name}</Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">{task.role}</Typography>
                                <Chip size="small" label={`${task.exp} exp`} sx={{ height: 20, fontSize: '0.65rem' }} />
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Box>
            );
          })}
        </Box>
      </DragDropContext>
    </Box>
  );
};

export default InterviewWorkspace;
