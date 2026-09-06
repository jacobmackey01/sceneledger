// Source snapshots checked 2026-09-06. Labels authored by Codex; independent review pending.
// Labels describe support in the supplied excerpt, NOT truth in the wider world.
const groups = [
  {
    id: "mars", url: "https://science.nasa.gov/mars/facts/", title: "NASA Mars Facts",
    excerpt: "Mars has two small moons, Phobos and Deimos, that may be captured asteroids.",
    rows: [
      ["Mars has two small moons.", "supported", "The excerpt explicitly gives the count."],
      ["The moons of Mars are named Phobos and Deimos.", "supported", "Both names are explicit."],
      ["Mars has three small moons.", "contradicted", "The excerpt says two, not three."],
      ["Mars has no moons.", "contradicted", "The excerpt explicitly identifies two moons."],
      ["Both Martian moons are definitely captured asteroids.", "insufficient", "May be does not establish a definite origin."],
      ["Phobos will collide with Mars next year.", "insufficient", "No collision date is supplied in this excerpt."],
    ],
  },
  {
    id: "earth", url: "https://science.nasa.gov/earth/facts/", title: "NASA Earth Facts",
    excerpt: "As Earth orbits the Sun, it completes one rotation every 23.9 hours. It takes 365.25 days to complete one trip around the Sun.",
    rows: [
      ["Earth completes a rotation in approximately 23.9 hours.", "supported", "Matches the supplied approximate rotation duration."],
      ["Earth takes about 365.25 days to orbit the Sun.", "supported", "Matches the orbital duration, with approximate wording."],
      ["Earth completes a rotation every 365.25 days.", "contradicted", "Confuses rotation and orbit."],
      ["Earth takes 23.9 hours to orbit the Sun.", "contradicted", "Confuses orbit and rotation."],
      ["Earth has exactly the same rotation period as Mars.", "insufficient", "No Mars period is supplied."],
      ["Earth's rotation period will remain unchanged forever.", "insufficient", "A current rounded measurement is not a future guarantee."],
    ],
  },
  {
    id: "venus", url: "https://science.nasa.gov/venus/venus-facts/", title: "NASA Venus Facts",
    excerpt: "Venus is the second planet from the Sun, and our closest planetary neighbor. It's the hottest planet in our solar system",
    rows: [
      ["Venus is second from the Sun.", "supported", "Orbital ordering is explicit."],
      ["Venus is the hottest planet in the solar system.", "supported", "Explicit comparison in the excerpt."],
      ["Venus is the first planet from the Sun.", "contradicted", "The excerpt says second."],
      ["Venus is not the hottest planet in our solar system.", "contradicted", "Negates the supplied comparison."],
      ["Venus has the highest temperature of any planet in the universe.", "insufficient", "Extends a solar-system claim to the universe."],
      ["Venus has always been the hottest planet.", "insufficient", "The excerpt does not establish its full history."],
    ],
  },
  {
    id: "apollo", url: "https://www.nasa.gov/mission/apollo-11/", title: "NASA Apollo 11",
    excerpt: "Neil Armstrong was the first person to walk on the moon. He was an astronaut. He flew on two space missions.",
    rows: [
      ["Neil Armstrong was the first person to walk on the Moon.", "supported", "The excerpt explicitly identifies him."],
      ["Armstrong flew on two space missions.", "supported", "The excerpt states the count."],
      ["Neil Armstrong never walked on the Moon.", "contradicted", "Direct negation of the supplied event."],
      ["Armstrong flew on five space missions.", "contradicted", "The excerpt says two."],
      ["Armstrong's first Moon walk lasted exactly six hours.", "insufficient", "No duration is supplied."],
      ["Everyone on Armstrong's missions walked on the Moon.", "insufficient", "The excerpt does not describe every crew member."],
    ],
  },
];

export const dataset = groups.map(({ rows, excerpt, ...group }) => ({
  ...group, sources: [{ id: "s1", title: group.title, url: group.url, publishDate: null, excerpts: [excerpt], queryIds: [group.id] }],
  cases: rows.map(([claim, proposedLabel, reason], index) => ({
    id: `${group.id}-${index + 1}`, lineId: `l${index + 1}`, claim, proposedLabel, reason,
    review: { reviewer: null, reviewedAt: null, label: null },
  })),
}));
export const datasetMetadata = {
  version: "2026-09-06.1", retrievedAt: "2026-09-06", author: "Codex",
  status: "provisional; independent human review pending", selection: "24 hand-selected narration probes in four correlated NASA excerpt bundles; not a random or representative sample",
};
