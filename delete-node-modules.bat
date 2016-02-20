REM Delete node_modules folder tree when full path names are too long.
REM http://superuser.com/questions/256105/how-do-i-delete-a-folder-which-is-nested-quite-deep-and-avoid-file-name-too-lon
@echo on

REM Navigate to the folder containing this "bat shell" file.
pushd %~dp0
pause

REM Create a temporary empty folder.
mkdir empty_node_modules

REM Mirror the empty folder into the node_modules folder using RoboCopy.
robocopy empty_node_modules node_modules /MIR

REM Finish deleting both empty folders.
rmdir /s/q node_modules
rmdir /s/q empty_node_modules

popd

echo "Done!"
pause
