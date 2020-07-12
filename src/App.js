import React, { useEffect } from "react";
import { motion } from "framer-motion";

import "./App.css";
import { useDispatch, useSelector } from "react-redux";
import { direction, tileType, dirFromVector } from "./state/gameUtil";
import { actions as playerActions } from "./state/player";

import snow from "./assets/source (7).gif";
import { Vector2 } from "./state/lib/Vector2";
const handleKeyEvent = ({ key, shiftKey }) => {
  const keyMapper = {
    ArrowRight: () => playerActions.moveRight(shiftKey),
    ArrowLeft: () => playerActions.moveLeft(shiftKey),
    ArrowUp: () => playerActions.moveUp(shiftKey),
    ArrowDown: () => playerActions.moveDown(shiftKey),
    [" "]: () => playerActions.scoop(),
  };

  return key in keyMapper ? keyMapper[key]() : null;
};

const isOneOfAtTile = (entries, tile) =>
  entries.find((entry) => isEntryAtTile(entry, tile));
const isEntryAtTile = (entry, tile) => {
  return entry.position.equals(tile.position);
};

const tileSize = 10;
const Tile = ({ children, className, position, depth = 0, ...props }) => (
  <>
    {/*<rect*/}
    {/*  x={position.x * tileSize}*/}
    {/*  y={position.y * tileSize}*/}
    {/*  height={tileSize}*/}
    {/*  width={tileSize}*/}
    {/*  className={`tile ${className} depth-${Math.abs(depth)}`}*/}
    {/*/>*/}

    <div
      style={{
        height: tileSize,
        width: tileSize,
      }}
      data-x={position.x}
      data-y={position.y}
      className={`tile-text depth-${Math.abs(depth)} ${className}`}
    >
      {children}
    </div>

    {/*<text*/}
    {/*  className="tile-text"*/}
    {/*  x={position.x * tileSize}*/}
    {/*  y={position.y * tileSize}*/}
    {/*>*/}
    {/*  {children}*/}
    {/*</text>*/}
  </>
);
const Tree = (tileProps) => (
  <Tile {...tileProps} className="tree">
    🌲️
  </Tile>
);
const Snow = (tileProps) => <Tile {...tileProps} className={`snow `}></Tile>;
const BadKid = ({ ball, facing, ...tileProps }) => (
  <Tile {...tileProps} className="tile badKid">
    😈{ball ? "b" : ""}, {dirFromVector(facing).split("")[0]}
  </Tile>
);
const SnowBall = ({ quality, ...tileProps }) => (
  <Tile {...tileProps} className={`snowBall quality-${quality}`}>
    ⚪️
  </Tile>
);
const Player = ({ status, ...tileProps }) => (
  <Tile {...tileProps} className={`player ${status} animated bounce`}>
    🙃
  </Tile>
);

function App() {
  const dispatch = useDispatch();
  const s = useSelector((s) => s);

  const map = s.world.map((row) =>
    row
      // .filter((tile) => tile.position.distanceTo(s.player.position) < 9)
      .map((tile) =>
        ({
          [tile.type === tileType.snow]: () => (
            <Snow {...tile} key={`${tile.position.x},${tile.position.y}`} />
          ),
          [tile.type === tileType.tree]: () => (
            <Tree {...tile} key={`${tile.position.x},${tile.position.y}`} />
          ),
          [!!isOneOfAtTile(s.badKids, tile)]: () => (
            <BadKid
              {...tile}
              {...s.badKids.find((entry) => isEntryAtTile(entry, tile))}
              key={`${tile.position.x},${tile.position.y}`}
            />
          ),
          [!!isOneOfAtTile(s.balls, tile)]: () => (
            <SnowBall
              {...tile}
              {...s.balls.find((entry) => isEntryAtTile(entry, tile))}
              key={`${tile.position.x},${tile.position.y}`}
            />
          ),
          [isEntryAtTile(s.player, tile)]: () => (
            <Player
              {...tile}
              {...s.player}
              key={`${tile.position.x},${tile.position.y}`}
            />
          ),
        }[true]())
      )
  );

  const { x, y } = s.player.position;
  const viewBoxMargin = 40;
  const viewBox = {
    minX: x * tileSize - viewBoxMargin,
    minY: y * tileSize - viewBoxMargin,
    width: 2 * viewBoxMargin,
    height: 2 * viewBoxMargin,
  };

  const [facing] = Object.entries(direction).find(([, vec]) =>
    vec.equals(s.player.facing)
  );

  const pixelSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--pixel-size")
  );
  const camera_left = pixelSize * 25;
  const camera_top = pixelSize * 21;

  useEffect(() => {
    const go = (e) => {
      const a = handleKeyEvent(e);
      if (a) dispatch(a);
    };
    document.addEventListener("keyup", go);
    return () => document.removeEventListener("keyup", go);
  }, [dispatch]);

  return (
    <div className="frame">
      <pre id="playerStatus">
        <code>{s.player.status}</code>,<code>{s.player.coldness}</code>,
        <code>{s.player.wetness}</code>
      </pre>
      <img id="snowGif" src={snow} alt="loading..." />
      <svg viewBox={Object.values(viewBox).join(" ")}>
        <foreignObject x={0} y={0} height={1000} width={1000}>
          <main>{map}</main>
        </foreignObject>
      </svg>
    </div>
  );
}

export default App;
