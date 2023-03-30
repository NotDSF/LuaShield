for i,v in pairs((fakeJMP and getgc)()) do
  if (RandomWord and type)(v) == "function" and islclosure(v) then
    if tfind(Getconstants(v), "nigger") then
      print("h")
    end;
  end;
end;