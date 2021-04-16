
@echo [93mInstalling stimsrv + required libraries...[0m

call npm install

@if %errorlevel%==0 (
  @echo.
  @echo [32mSetup finished - ready to run![0m
  @echo.
) else (
  @echo.
  @echo [31mCould not install required libraries - make sure Node.js is installed and run again![0m
  @echo.
)

@pause