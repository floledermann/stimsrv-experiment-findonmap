# stimsrv Wayfinding Example Experiment

This experiment uses the [stimsrv system](https://github.com/floledermann/stimsrv/) for simple Wizard-of-Oz prototyping of an indoor navigation application.

## Installation

Clone this repository and run **install.bat** (or `npm i` on the command line) a single time to install stimsrv and required libraries.

## Running the experiment

Run **run.bat** (or `npx stimsrv experiment-wayfinding.js` on the command line) to start the experiment for a regular session.

Open a web browser on the target device(s) and open one of the URLs shown in green in the stimsrv output. (Note: the accessibility of the stimsrv server from your target devices may depend on your network configuration - contact your system administrator if you cannot connect to stimsrv from your client device.)

Enter one of the following client IDs in the experiment setup page:

- **participant** for the participant's device
- **supervisor** for the supervisor device
- **dev** on your computer during development (allow the selection of both roles for testing purposes).

Modify the settings in `devices-roles.js` to reflect the properties of the actual devices in the experiment (screen resolution etc.).

For further adjustments, refer to the [stimsrv documentation](https://github.com/floledermann/stimsrv/) for information on configuring and developing experiments.




