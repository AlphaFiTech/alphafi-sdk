module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "babel-jest",
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
