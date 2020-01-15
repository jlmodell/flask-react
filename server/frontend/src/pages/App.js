import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  AppBar,
  Toolbar,
  Drawer,
  Typography,
  List,
  Divider,
  ListItem,
  ListItemText
} from "@material-ui/core/";
import { Link, Router } from "@reach/router";
import { HelenFile, HelenSuccess } from "./Helen";
import { Bic, BicSuccess } from "./Bic";
import { Idle, IdleSuccess } from "./Idle";
import { Planning, PlanningSuccess } from "./Planning";
import { Tracings, TracingsSuccess } from './Tracings';

const drawerWidth = 240;

export const App = () => {
  const classes = useStyles();
  const drawerItems = [
    { text: "Home", link: "/" },
    { text: "Idle Cost Calculator", link: "idle" },
    { text: "Helen 6417R1 File", link: "helen" },
    { text: "BIC Form Packer", link: "bic" },
    { text: "Heber Planning Function", link: "planning" },
    { text: "Sales Trace by Item", link: "tracings" },
  ];

  return (
    <div className={classes.root}>
      <div>
        <AppBar className={classes.appBar} position="fixed">
          <Toolbar>
            <Typography variant="h6" noWrap>
              <strong>Busse</strong> Hospital Disposables |{" "}
              <i>Internal Functions</i>
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          className={classes.drawer}
          variant="permanent"
          classes={{
            paper: classes.drawerPaper
          }}
        >
          <div className={classes.toolbar} />
          <List>
            {drawerItems.map((d, i) => (
              <React.Fragment key={d.text + "-" + i}>
                <ListItem button key={d.text}>
                  <Link to={d.link}>
                    <ListItemText primary={d.text} />
                  </Link>
                </ListItem>
                <Divider key={i} />
              </React.Fragment>
            ))}
          </List>
        </Drawer>
      </div>

      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Router>
          <Home path="/" />
          <HelenFile path="helen" />
          <HelenSuccess path="helen_success" />
          <Idle path="idle" />
          <IdleSuccess path="idle_success" />
          <Bic path="bic" />
          <BicSuccess path="bic_success" />
          <Planning path="planning" />
          <PlanningSuccess path="planning_success" />
          <Tracings path="tracings" />
          <TracingsSuccess path="tracings_success" />
        </Router>
      </main>
    </div>
  );
};

const Home = () => (
  <div>
    <h1>Welcome</h1>
  </div>
);

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex"
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3)
  },
  toolbar: theme.mixins.toolbar
}));
