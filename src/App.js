import React from "react";
import "./App.css";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "./state/body";
import { useEntityDispatch } from "./state/util";
import { actions as directorActions } from "./state/director";
const Team = ({ teamCollection, teamName }) =>
  Object.entries(teamCollection).map(([id, { x, y, r }]) => (
    <circle data-id={id} className={teamName} cx={x} cy={y} r={r} />
  ));

function App() {
  const dispatch = useDispatch();
  const teamA = useSelector((s) => s.teamA);
  const teamB = useSelector((s) => s.teamB);
  const distance = useSelector((s) => s.distance);
  const playerDispatch = useEntityDispatch("player");
  const movePlayer = ({ clientX, clientY, target, ...e }) => {
    const pt = target.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    const { x, y } = pt.matrixTransform(target.getScreenCTM().inverse());

    playerDispatch(actions.to({ nextX: x, nextY: y }));
  };
  const togglePlayerTeam = () => {
    dispatch(directorActions.changeTeam("player"));
  };

  return (
    <div className="App">
      <h1>{distance}</h1>
      <button onClick={togglePlayerTeam}>Change Player's Team</button>
      <svg
        viewBox="0 0 700 600"
        height="50vh"
        width="100vw"
        onClick={movePlayer}
      >
        <Team teamCollection={teamA} teamName="teamA" />
        <Team teamCollection={teamB} teamName="teamB" />
      </svg>
    </div>
  );
}

export default App;
