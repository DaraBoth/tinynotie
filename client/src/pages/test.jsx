import React from 'react';
import { Card, CardContent, Typography, Box, Grid, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const TripCard = ({ trip, onEdit, onDelete }) => {
  const { trp_name, spend, mem_id, create_date } = trip;

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div">
          {trp_name}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          Created on: {create_date}
        </Typography>
        <Typography variant="body2"> 
          Spend: {spend}
        </Typography>
        <Typography variant="body2">
          Members: {mem_id.length} Members
        </Typography>
      </CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2, pb: 2 }}>
        <IconButton onClick={onEdit}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </Box>
    </Card>
  );
};

const TripList = ({ trips, onEditTrip, onDeleteTrip }) => {
  return (
    <Grid container spacing={2}>
      {trips.map((trip) => (
        <Grid item xs={12} sm={6} md={4} key={trip.id}>
          <TripCard trip={trip} onEdit={() => onEditTrip(trip)} onDelete={() => onDeleteTrip(trip.id)} />
        </Grid>
      ))}
    </Grid>
  );
};

export default TripList;
