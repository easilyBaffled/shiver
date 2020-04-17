const getPlayer = () => cy.get('[data-id="player"]');
const getTarget = () => cy.get('[data-id="target"]');
const isTeamA = (body) =>
  body
    .should("have.css", "fill") // yields 'sans-serif'
    .and("match", /rgb\(255, 99, 71\)/);

const isTeamB = (body) =>
  body
    .should("have.css", "fill") // yields 'sans-serif'
    .and("match", /rgb\(0, 128, 128\)/);

const clickAt = (clientX, clientY) =>
  cy.get("svg").trigger("mousemove", { clientX, clientY }).click();

describe("app", () => {
  it("will exist", () => {
    cy.visit("http://localhost:3000/");
  });
  describe("initialize", () => {
    it("initial distance will be 0", () => {
      cy.contains("0");
    });
    it("Both bodies will be on screen", () => {
      getPlayer();
      getTarget();
    });
  });
  describe("actions", () => {
    beforeEach(() => {
      cy.eyesOpen({
        appName: "Redux Base",
      });
    });
    afterEach(() => {
      cy.eyesClose();
    });
    it("button will toggle the player between teamA and teamB", () => {
      isTeamA(getPlayer());
      cy.contains("Change Player").click();
      isTeamB(getPlayer());
      cy.contains("Change Player").click();
      isTeamA(getPlayer());
    });
    it("clicking on space will move the player", () => {
      clickAt(150, 150);
      getPlayer().then(($el) => {
        const { x, y } = $el[0].getBoundingClientRect();

        expect(x).to.equal(494.5);
        expect(y).to.equal(259.5);
      });
    });
    it("should track the distance between the bodies", () => {
      cy.contains(319);
    });
  });
});
