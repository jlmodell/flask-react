import React from "react";
import { Link, Router } from "@reach/router";
import { HelenFile, HelenSuccess } from "./Helen";
import { Bic, BicSuccess } from "./Bic";
import { Planning, PlanningSuccess } from "./Planning";

export const App = () => {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="helen">Helen 6417R1 File</Link>
        <Link to="bic">Bic</Link>
        <Link to="planning">Planning (Heber)</Link>
      </nav>
      <Router>
        <Home path="/" />
        <HelenFile path="helen" />
        <HelenSuccess path="helen_success" />
        <Bic path="bic" />
        <BicSuccess path="bic_success" />
        <Planning path="planning" />
        <PlanningSuccess path="planning_success" />
      </Router>
    </div>
  );
};

const Home = () => (
  <div>
    <h1>Welcome</h1>
  </div>
);
