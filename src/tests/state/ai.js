import _ from "lodash";
import { isFallen, actions as playerActions } from "#/state/player";
import { direction } from "#/state/gameUtil";
import { getTile, isWalkable } from "#/state/world";

const distanceToPlayer = (pos, player) => pos.distanceTo(player.position);

const inDiscomfortRange = (kid, player) =>
  kid.discomfortRange <= distanceToPlayer(kid.position, player);

const inBallRange = (kid, player) =>
  kid.ball && kid.ball.quality >= distanceToPlayer(kid.position, player);

const isMeek = (kid) => kid.meek;
const hasBall = (kid) => kid.ball;

const onAxis = (pos1, pos2) => pos1.x === pos2.x || pos1.y === pos2.y;

const nextPos = (sorter, minMax) => (kid, player, world) => {
  const currentPos = kid.position;
  const dir = Object.entries(direction)
    .map(([name, vec]) => {
      const tile = getTile(world, currentPos.clone().add(vec));
      return tile && isWalkable(tile) && !tile.position.equals(player.position)
        ? [name, distanceToPlayer(currentPos, player)]
        : [name, minMax];
    })
    .sort(sorter)[0][0];
  return _.capitalize(dir);
};

const nexNearestPos = nextPos((a, b) => a[1] - b[1], Infinity);
const nexFurthestPos = nextPos((a, b) => b[1] - a[1], -Infinity);

export const nextMove = (kid, { world, player }) => {
  if (isFallen(kid)) return playerActions.moveLeft();
  if (inBallRange(kid, player)) {
    return {
      [true]: () => playerActions[`move${nexNearestPos(kid, player, world)}`](),
      [onAxis(kid, player)]: () =>
        playerActions.throwBall({
          position: kid.position,
          direction: kid.direction,
          quality: kid.ball.quality,
        }),
    }[true]();
  }
  if (inDiscomfortRange(kid, player)) {
    return {
      [true]: () =>
        playerActions[`move${nexNearestPos(kid, player, world)}`](true),
      [!hasBall(kid)]: () =>
        playerActions[`move${nexFurthestPos(kid, player, world)}`](true),
      [!isMeek(kid)]: () => {
        playerActions[`move${nexNearestPos(kid, player, world)}`]();
      },
    }[true]();
  }

  return {
    [true]: () => playerActions[`move${nexNearestPos(kid, player, world)}`](),
    [!isMeek(kid)]: () =>
      playerActions[`move${nexNearestPos(kid, player, world)}`](true),
    [!hasBall(kid)]: () => playerActions.scoop(),
  }[true]();
};
