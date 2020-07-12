import _ from "lodash";
import { isFallen, actions as playerActions } from "./player";
import { direction, dirFromVector } from "./gameUtil";
import { getTile, isWalkable } from "./world";

const distanceToPlayer = (pos, player) => pos.distanceTo(player.position);

const inDiscomfortRange = (kid, player) =>
  kid.discomfortRange >= distanceToPlayer(kid.position, player);

const inBallRange = (kid, player) =>
  kid.ball && kid.ball.quality * 5 >= distanceToPlayer(kid.position, player);

const isMeek = (kid) => !!kid.meek;
const hasBall = (kid) => !!kid.ball;

const onAxis = ({ position: pos1 }, { position: pos2 }) =>
  pos1.x === pos2.x || pos1.y === pos2.y;

const isValidTile = (tile, player, world, balls) =>
  tile &&
  isWalkable(tile) &&
  !tile.position.equals(player.position) &&
  balls.every((b) => !b.position.equals(tile));

const nextPos = (sorter, minMax) => (kid, player, world, balls) => {
  const currentPos = kid.position;
  const dir = Object.entries(direction)
    .map(([name, vec]) => {
      const tile = getTile(world, currentPos.clone().add(vec));

      return isValidTile(tile, player, world, balls)
        ? [name, distanceToPlayer(tile.position, player)]
        : [name, minMax];
    })
    .sort(sorter)[0][0];
  return _.capitalize(dir);
};

const nexNearestPos = nextPos((a, b) => a[1] - b[1], Infinity);
const nexFurthestPos = nextPos((a, b) => b[1] - a[1], -Infinity);

const getFacingVec = ({ position: kp }, { position: pp }) =>
  pp.clone().sub(kp).clampScalar(-1, 1);
const isFacing = (kid, player) => {
  const shouldFace = getFacingVec(kid, player);
  return shouldFace.equals(kid.facing);
};

export const nextMove = (kid, { world, player, balls }) => {
  // console.log({
  //   hasBall: hasBall(kid),
  //   inBallRange: hasBall(kid) && inBallRange(kid, player),
  //   inDiscomfortRange: inDiscomfortRange(kid, player),
  // });
  if (isFallen(kid)) return playerActions.moveLeft();

  if (hasBall(kid) && inBallRange(kid, player)) {
    return {
      [true]: () =>
        playerActions[`move${nexNearestPos(kid, player, world, balls)}`](true),
      [onAxis(kid, player) && isFacing(kid, player)]: () =>
        playerActions.throwBall({
          position: kid.position,
          direction: kid.direction,
          quality: kid.ball.quality,
        }),
      [onAxis(kid, player) && !isFacing(kid, player)]: () => {
        console.log(
          kid.position,
          player.position,
          getFacingVec(kid, player),
          dirFromVector(getFacingVec(kid, player))
        );
        const newFacingVec = dirFromVector(getFacingVec(kid, player));
        const isValidMove = isValidTile(
          kid.position.clone().add(newFacingVec),
          player,
          world,
          balls
        );

        const nextDir = isValidMove
          ? dirFromVector(getFacingVec(kid, player))
          : nexNearestPos(kid, player, world, balls);

        return playerActions[`move${nextDir}`]();
      },
    }[true]();
  } else if (inDiscomfortRange(kid, player)) {
    return {
      [true]: () =>
        playerActions[`move${nexNearestPos(kid, player, world, balls)}`](true),
      [isMeek(kid)]: () =>
        playerActions[`move${nexNearestPos(kid, player, world, balls)}`](),
      [!hasBall(kid)]: () =>
        playerActions[`move${nexFurthestPos(kid, player, world, balls)}`](true),
    }[true]();
  }

  return {
    [true]: () =>
      playerActions[`move${nexNearestPos(kid, player, world, balls)}`](),
    [!isMeek(kid)]: () =>
      playerActions[`move${nexNearestPos(kid, player, world, balls)}`](true),
    [!hasBall(kid)]: () => playerActions.scoop(),
  }[true]();
};
