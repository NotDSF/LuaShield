for i,v in pairs(getgc()) do
  if type(v) == "function" and islclosure(v) then
    if table.find(debug.getconstants(v), "nigger") then
      print("h")
    end;
  end;
end;