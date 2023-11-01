import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material';
import { tokens } from '../theme'

export default function AlignItemsList({ item }) {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    console.log(item);
    return (
        <List
            sx={{
                width: '100%',
                height:"100%",
                padding:"10px",
                bgcolor: colors.primary[400]
            }}
        >
            {item?.map((item, index) => {
                return (
                    <>
                        <ListItem
                            key={item.id}
                            sx={{
                                backgroundColor: colors.primary[500],
                                width: "200px"
                            }}
                            alignItems="flex-start">
                            <ListItemText
                                primary={item.grp_name}
                                secondary={
                                    <React.Fragment>
                                        {item.description}
                                    </React.Fragment>
                                }
                            />
                        </ListItem>
                    </>
                )
            })}

        </List>
    );
}
