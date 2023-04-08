--[[
  LuaShield Client
  v1.0.0
]]

local function LPH_ENCSTR(...) return ... end;
local function LS_OPCODESPAM(...) return end;
local function LPH_JIT(...) return ... end;
local function LS_NUMENC(...) return ... end;

local TimeNow = tick();
local ProjectID = LPH_ENCSTR("PROJECT_ID");
local ScriptIdentifier = LPH_ENCSTR("SCRIPT_ID");
local ScriptVersion = LPH_ENCSTR("SCRIPT_VERSION");
local LuaShield = 1;

if getgenv().LuaShield then return end; -- Stops retards executing twice
getgenv().LuaShield = true;

local whitelistVersion = LPH_ENCSTR("MhWNanXETbExiLH"); -- this doesnt matter all that much since the script id and shit will be changed each update.
local this = debug.getinfo(1);
local HttpService = game.HttpService;
local is_synapse_function = is_synapse_function or checkclosure;
-- File download

if not is_synapse_function then 
  LPH_CRASH();
end;

if not isfolder("LuaShield") then makefolder("LuaShield") end;
if not isfolder("LuaShield/bin") then makefolder("LuaShield/bin") end;

-- Whitelist

if script.Parent then
  LPH_CRASH();
  while true do end;
end;

if not islclosure(function() end) then
  LPH_CRASH();
  while true do end;
end;

if pcall(islclosure) then
  LPH_CRASH();
  while true do end;
end;

if not is_synapse_function(function() end) then
  LPH_CRASH();
  while true do end;
end;

if is_synapse_function(getrenv().string.sub) then
  LPH_CRASH();
  while true do end;
end;

loadstring("--")(); -- Hard check for sandboxed env cause roblox doesn't support loadstring
loadstring("getgenv().a = true")();
if not getgenv().a then
  LPH_CRASH();
  while true do end;
end;

local request = syn and syn.request or request;
local LS_REQUEST;
local LS_AccessToken;

do
    local ProtectObject;
    local ProtectedObject;
    local getinfo = getinfo;
    local init = getfenv(0).script.name;
    local hookfunction = hookfunction;
    local setmetatable = setmetatable;

    -- internals
    do
        local block = {};
        local _getgc;
        
        local function Hook(...) 
            local gc = _getgc();
            for i=1, #gc do
                local found = block[gc[i]];
                if found then
                    gc[i] = nil;
                end;
            end;
            return gc;
        end
        
        _getgc = hookfunction(getgc, Hook);
    
        ProtectObject = function(obj) 
            block[#block+1] = obj;
            return obj;
        end;
    
        ProtectedObject = function(obj) 
            for i=1, #block do
                if block[i] == obj then
                    return true;
                end;
            end;
            return false;
        end;
    
        ProtectObject(ProtectObject);
        ProtectObject(ProtectedObject);
        ProtectObject(block);
        ProtectObject(Hook);
    end;
    
    LS_REQUEST = ProtectObject(function(req) 
        req = ProtectObject(req);
        return request(setmetatable({}, {
            __index = ProtectObject(function(self, idx) 
                if getfenv(0).script.name ~= init then
                    while true do end;
                end;
                
                if not ProtectedObject(getinfo(1).func) then
                    while true do end;
                end;
    
                if not ProtectedObject(getinfo(3).func) then
                    while true do end;
                end;
    
                if idx == "Url" then
                    return req.Url;
                elseif idx == "Method" then
                    return req.Method;
                elseif idx == "Body" then
                    return req.Body;
                elseif idx == "Headers" then
                    return req.Headers;
                end;
            end);
        }));
    end);    
end;

local function HttpGet(Url) 
  return LS_REQUEST({ Url = Url, Method = "GET" }).Body;
end;

local function LS_SecureWebhook(Url, body) 
  local Response = request({
    Url = Url,
    Method = "POST",
    Headers = {
      ["content-type"] = "application/json",
      ["luashield-access-token"] = LS_AccessToken
    },
    Body = game.HttpService:JSONEncode(body)
  });

  if Response.StatusCode ~= 200 then
    error(Response.Body);
  end;

  return true;
end;

do
  local CurrentVersion = HttpGet(LPH_ENCSTR("http://localhost/auth/version"));
  if whitelistVersion ~= CurrentVersion then
    return print(string.format("This script is outdated, please tell the owner to update it. %s -> %s", whitelistVersion, CurrentVersion));
  end;
end;


local Sub      = string.sub;
local Char     = string.char;
local Gmatch   = string.gmatch;
local sqrt     = math.sqrt;
local format   = string.format;
local Tostring = tostring;
local Newproxy = newproxy;
local Pcall    = pcall;
local Type     = type;
local getfenv  = getfenv;
local Getrenv  = getrenv;
local charTBL  = table.create(255);
local BackupPrint = clonefunction(print);
local Kick = clonefunction(game.Players.LocalPlayer.Kick);
local MRandom;

local IDENTIFIERS = {
  SYNAPSE = 0;
  SYNAPSEV3 = 1;
  SCRIPTWARE = 2
}

local CURRENT_EXPLOIT = syn and syn.oth and IDENTIFIERS.SYNAPSEV3 or syn and IDENTIFIERS.SYNAPSE or not syn and IDENTIFIERS.SCRIPTWARE;

local function CrashLog(msg) 
  local Name = string.format("LuaShield/crash-%s-%d.txt", ProjectID, math.random(1, 9999)); 
  writefile(Name, msg);
end;

local function LPH_CRASH(...) error("Blocked crash"); end; -- Remove in prod

do
  local r, f = Random.new();
  local mt = getrawmetatable(r);

  if islclosure(Random.new) then
    while true do end;
  end;

  if Pcall(mt.__index, r, Tostring(Newproxy())) then
    while true do end;
  end;

  f = mt.__index(r, "NextInteger");

  MRandom = LPH_JIT(function(...)     
    local r = f(r, ...);
    f = mt.__index(r, "NextInteger");
    return r;
  end);
end;

do
  local i, v, b = "", MRandom(100,99999);
  for _=1,5 do
    i = i .. Char(MRandom(100,122));
  end;

  local indexed;

  b = hookmetamethod(game, "__index", LPH_JIT(function(self, idx) 
    if idx == i and checkcaller() then
      indexed = true;
      return v;
    end;
    return b(self, idx);
  end));

  if game[i] ~= v then
    LPH_CRASH();
    while true do end;
  end;

  if not indexed then
    LPH_CRASH();
    while true do end;
  end;

  -- Set to original for performance reasons
  local mt = getrawmetatable(game);
  setreadonly(mt, false);
  mt.__index = b;
  setreadonly(mt, true);
end;

for i=0,255 do
  local char = Char(i);
  charTBL[i] = char;
  charTBL[char] = i;
end;

local function decodeString(str) 
  local Pos, Finished = 1, "";
  while Pos <= #str do
    local Len = Sub(str, Pos, Pos);
    local Byte = Sub(str, Pos+1, Pos+Len);
    Finished = Finished .. charTBL[Byte-LS_NUMENC(87)];
    Pos = Pos + 1 + Len;
  end;
  return Finished;
end;

--[[
  local function DecompressString(str) 
  local out = ""
  for i=1, #str do
    out = out .. charTBL[Sub(str, i, i)];
  end;
  return out;
end;
]]

local function JSONDecode(bytecode) 
  if Sub(bytecode, 0, 3) ~= "LS|" then
    CrashLog(LPH_ENCSTR("s1dqg8wvfnao"));
    LPH_CRASH();
  end;

  bytecode = Sub(bytecode, 4);

  local NewBytecode = "";
  --bytecode = DecompressString(bytecode);

  do
    local str = bytecode;
    local Pos = 1;
    while Pos <= #str do
      local Len = Sub(str, Pos, Pos);
      local Byte = Sub(str, Pos+1, Pos+Len);
      NewBytecode = NewBytecode .. charTBL[Byte-LS_NUMENC(87)];
      Pos = Pos + 1 + Len;
    end;
  end;

  bytecode = NewBytecode;

  local Pos = 1;

  local function gBits8() 
    local r = Sub(bytecode, Pos, Pos);
    Pos = Pos + 1;
    return r + 0;
  end;

  local function gInt() 
    local len = gBits8();
    local r = Sub(bytecode, Pos, Pos + len - 1);
    Pos = Pos + len;
    return r + 0;
  end;

  local function gString() 
    local len = gInt();
    local r = "";
    for i=1, len do
      r = r .. charTBL[gInt()];
    end;
    return r;
  end;

  local function DecodeObject() 
    local Size = gInt();
    local Object = {};

    local function HandleValue() 
      local Type = gInt();
      if Type == LS_NUMENC(75) then
        return gString();
      elseif Type == LS_NUMENC(886) then
        return gInt();
      elseif Type == LS_NUMENC(679) then
        return DecodeObject();
      elseif Type == LS_NUMENC(88) then
        return gBits8() == 1;
      elseif Type == LS_NUMENC(39) then -- special number
        return gString() + 0;
      end;
    end;

    local Timestamp = gString();
    if os.time() - Timestamp > LS_NUMENC(50) then
      LPH_CRASH();
      while true do end;
    end;

    for i=1, Size do
      local i,v = HandleValue(), HandleValue();
      Object[i] = v;
    end;

    return Object;
  end;

  return DecodeObject();
end;


-- Little Trolling Eh
do
  local Sanity = LS_REQUEST({
    Url = LPH_ENCSTR("http://localhost/auth/info"),
    Method = "GET",
    Headers = {
      ["nptxxjzypm"] = ProjectID,
      ["yslragqbrg"] = ScriptIdentifier,
      ["ngdydrcqzg"] = rawget(getfenv(0), "Key") or ""
    }
  });

  if Sanity.StatusCode ~= 200 then
    LPH_CRASH();
  end;

  local Info = JSONDecode(Sanity.Body);

  -- Does not have whitelist
  if Info.a ~= 1 and Info.d ~= 1 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("You aren't whitelisted to this project"));
    LPH_CRASH();
  end;

  -- Project supports exploit
  if Info.b ~= 0 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("This project doesn't support your exploit"));
    LPH_CRASH();
  end;

  -- Project offline
  if Info.c ~= 1 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("This project is offline"));
    LPH_CRASH();
  end;

  if Info.e ~= ScriptVersion then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("This script is outdated"));
    LPH_CRASH();
  end;

  -- User already has ran
  if Info.f ~= 0 then
    Kick(game.Players.LocalPlayer, LPH_ENCSTR("You already have an ongoing connection to the LuaShield servers"));
    LPH_CRASH();
  end;
end;

local EndPoints, HWID, synUserId = (function()
  local Data = JSONDecode(HttpGet(LPH_ENCSTR("http://localhost/auth/DBMNOUCcpGDlDcrFtbUXuAGePzbOqnFxKwhPCVroCuFtuXfnpsfiwkAfQXvopcdzMpSuPvobgmDchPepdUaDpXKbUQEAzmjazbDx")));
  local JSON = Data["1"];
  local Headers = Data["2"];

  if Data.JSONHWID ~= Headers["1"] then -- Headers[1] is HWID
    CrashLog(LPH_ENCSTR("kc89zypzp9wf"));
    LPH_CRASH();
    while true do end;
  end;

  return {
    decodeString(JSON["1"]),
    decodeString(JSON["2"])
  }, Headers["1"], Headers["2"];
end)();

local LS_ScriptName, LS_ScriptVersion, LS_Exploit, LS_Executions, LS_CrackAttempts, LS_Username;

local function FingerPrint()
  local Response = HttpGet(format("http://localhost/auth/%s", EndPoints[1]));
  local JSON = JSONDecode(Response);
  return {
    JSON["1"],
    JSON["2"],
    JSON["3"]
  }; -- Stops people using retarded spoofing methods
end;

local callMe = LPH_JIT(function(a, b) return a,b end);  -- Not only does this confuse people hooking calls but would also double as a return spoofer
local function RandomWord(arg1)
  local Word = "";
  for i=1,arg1 do
    Word = Word .. charTBL[MRandom(65,122)];
  end;
  return Word;
end;

-- Returns a string that does not contain a special character.
local function RandomWord2() 
  local Word = "";
  for i=1,20 do
    Word = Word .. charTBL[MRandom(100,122)];
  end;
  return Word;
end;

local RequestHash = RandomWord2();

local function fakeConcat() 
  local fuckPozm = "";
  for i=1, 10 do
    fuckPozm = fuckPozm .. RandomWord(5);
  end;
end;

-- Unpredictable JMP. (unless you hook osDate but we won't talk about that)
local function fakeJMP() 
  for i=1, 5 do
    if i < 9999 then end;
    if i > 9999 then end;
    if i == i then end;
    if i ~= i then while true do end end;
  end;
end;

local function EQ(arg1, arg2)
  local RandomString1 = RandomWord(20);
  callMe(RandomString1, RandomString1 .. RandomString1);
  if arg1 ~= arg2 and arg1 == arg2 then
    while true do end;
  end;
  fakeJMP();
  if arg1 == arg2 then
    return true;
  end;
  if RandomString1 == RandomString1 .. RandomString1 then
    while true do end;
  end;
  callMe(RandomString1, RandomString1 .. RandomString1);
  LS_OPCODESPAM("EQ");
end;

fakeJMP();

-- Detects a shit http spy known as frost hook
if EQ(getgenv().FrostHookSpy, true) then
  while true do end;
end;

local Islclosure = islclosure;
local Getupvalue = debug.getupvalue;
local Getconstants = debug.getconstants;
local Setupvalue = debug.setupvalue;
local Getupvalues = debug.getupvalues;
local Info = debug.info;
local IsSynF = is_synapse_function;
local pairs = pairs;

local exploitenv = getgenv();
local bgetinfo = debug.getinfo;
local gc = getgc();
local tfind = table.find;

if LPH_OBFUSCATED then
  for i=1, #gc do
    local v = gc[i];
    if Type(v) == "function" then
      if IsSynF(v) and Islclosure(v) and bgetinfo(v).func ~= this.func then
        for _, v2 in pairs(Getconstants(v)) do
          if v2 == "TrackHttp" 
          or v2 == "rbxassetid://1762060839"
          or v2 == "https://raw.githubusercontent.com/NotDSF/Lua-Serializer/main/Serializer%20Highlighting.lua" 
          or v2 == "HttpGet Request Sent To: " 
          or v2 == "A new instance was created: " 
          or v2 == "Script Analyzer" 
          or v2 == "disablehttpreq" 
          or v2 == "GetObjects Link: "
          or v2 == "https://raw.githubusercontent.com/NotDSF/leopard/main/rbx/leopard-syn.lua" 
          or v2 == "https://raw.githubusercontent.com/Introvert1337/RobloxReleases/main/Scripts/Utilities/TableFormatter.lua" 
          or v2 == "\n\nsyn.request(%s)\n\nResponse Payload: %s"
          or v2 == "\n    - URL: " -- https://raw.githubusercontent.com/topitbopit/rblx/main/http_spy.lua
          or v2 == "DEX"
          or v2 == "{} --[[DUPLICATE]]" then -- https://github.com/jheinem1/Lua-Serializer/blob/main/src/serializer.lua
            LPH_CRASH();
            while true do end;
          end;
        end;
      end;
    end;
  end;
end;


if Islclosure(Getrenv().print) then
  LPH_CRASH();
  while true do end;
end;

if Islclosure(request) then
  LPH_CRASH();
  while true do end;
end;

if EQ(Islclosure(function() end), false) then
  LPH_CRASH();
  while true do end;
end;

if not EQ(Type(Getupvalue(request, 1)), CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSE and "userdata" or "nil") then
  LPH_CRASH();
  while true do end;
end;

if not EQ(Type(Getupvalue(HttpService.JSONDecode, 1)), CURRENT_EXPLOIT == IDENTIFIERS.SCRIPTWARE and "nil" or "userdata") then
  LPH_CRASH();
  while true do end;
end;

fakeJMP();

if EQ(Pcall(function() WebsocketClient.new(RandomWord(5)) end), true) then
  LPH_CRASH();
  while true do end;
end;

if EQ(Pcall(function() Getconstants(request) end), true) then
  LPH_CRASH();
  while true do end;
end;

if EQ(RandomWord(5), RandomWord(5)) then
  LPH_CRASH();
  while true do end;
end;

if not EQ(IsSynF(function() end), true) then
  LPH_CRASH();
  while true do end;
end;

local function HashString(str) 
  local r = 0;
  for p=1, #str do
    local k = Sub(str, p, p);
    r = r + charTBL[k] + (p - 1);
  end;
  return r;
end;

local crypt = syn and syn.crypt or crypt;
local HashedSynapseID = HashString(synUserId);
local PersonalKey = math.pow(HashedSynapseID, 2) .. Sub(synUserId, 0, 5) .. math.pow(HashedSynapseID, 4);
PersonalKey = PersonalKey .. ("x"):rep(32 - #PersonalKey);

if CURRENT_EXPLOIT == IDENTIFIERS.SCRIPTWARE then
  PersonalKey = crypt.base64encode(PersonalKey);
end;

if isfile("LuaShield/bin/token.bin") and readfile("LuaShield/bin/token.bin") ~= crypt.hash(PersonalKey) then
  CrashLog(LPH_ENCSTR("x5pati9q46c7"));
  LPH_CRASH();
  while true do end;
end;

if not isfile("LuaShield/bin/token.bin") then
  writefile("LuaShield/bin/token.bin", crypt.hash(PersonalKey));
end;

local Key = rawget(getfenv(0), "Key");
if not Key then
  CrashLog(LPH_ENCSTR("1y579zofsm7s"));
  LPH_CRASH();
  while true do end;
end;

local FingerprintJSON = FingerPrint();
local Fingerprint = FingerprintJSON[1];
local NumberId, fakeSet = "", "";
local reqId, fakeReqId = "", "";

fakeConcat();

local function sortoutjsonfuckery(tbl) 
  local new = {};
  for i,v in pairs(tbl) do
    new[i + 1] = v;
  end;
  return new;
end

for i,v in pairs(sortoutjsonfuckery(FingerprintJSON[2])) do
  if Type(v) == "table" then
    v = sortoutjsonfuckery(v);
    local Length = v[3];
    if Length == 8 then -- 1
      fakeSet = fakeSet .. v[1]*2+2321;
      NumberId = NumberId .. v[1]-v[2]-v[2];
    elseif Length == 10 then -- 2
      fakeSet = fakeSet .. v[2]/2*3;
      NumberId = NumberId .. v[1]+v[2];
    elseif Length == 1 then -- 3
      fakeSet = fakeSet .. v[2]^3;
      NumberId = NumberId .. v[1];
    elseif Length == 3 then -- 4
      fakeSet = fakeSet .. v[1]+4424;
      NumberId = NumberId .. format("%d", v[1]-math.pi);
    elseif Length == 6 then -- 5
      fakeSet = fakeSet .. v[1]+-222;
      NumberId = NumberId .. format("%d", v[1]-sqrt(v[2]));
    elseif Length == 7 then
      fakeSet = fakeSet .. v[1]-v[1]+2323+v[2];
      NumberId = NumberId .. v[1]/2;
    end;
  end;
end;

LS_OPCODESPAM("LOADK");

do
  local reqIdTable = FingerprintJSON[3];
  local encKey, reqBytes = reqIdTable["0"], reqIdTable["1"];
  local sorted = {};
  for i,v in pairs(reqBytes) do
    sorted[i + 1] = v;
  end;
  for i,v in pairs(sorted) do
    reqId = reqId .. charTBL[v - encKey - #sorted - i];
    fakeReqId = fakeReqId .. RandomWord(3);
  end;
end;

LS_OPCODESPAM("CONCAT")

-- A lot smarter to unpack strings after checks have occured! (will be using ce so 'unpack' applies)

local ScriptID = LPH_ENCSTR("EknsQsbbtQzKOFKyepMlewERNRarAbiFoasAyiLCZXKDzDatOBHVJcbZzEVKsOGMBhAZfPohhFQopdQctiiEvmTmUNgRtcQUdMSl");
local ServerId = LPH_ENCSTR("rsficmcZCjNyIWdpGrjVgzoNBzVakkuFGmhEjapUGvgzhkIbWyujViPlBjKjFctWmKCsSTWDhuarpRECpJefGyZfcixbyEfhVGIz");
local WebsocketId = LPH_ENCSTR("PibNiKCVCHuabRUvUfFqlcJMizJpuyOUJqeubRKduLWNQOCDjILzOwYpHXrMQSVlPLjRjgGuJVgRassCBcHtVcxYWwrsdLLxPJde");
local StackReplay = tick();
local HashStackReplay = HashString(StackReplay .. "");

-- Can't be restored from a luraph stack dump so we can check if these values exist in the main stack frame
local StackReplay2 = newproxy(true);
local StackReplay3 = Instance.new("IntValue");
StackReplay3.Name = RandomWord(10);

local Connect = 
CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSE and syn.websocket.connect or
CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 and WebsocketClient.new or
WebSocket.connect;

local WS, WebsocketKey = Connect("ws://localhost/ws");
if CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 then
  WS:Connect();
end;

WS[CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 and "DataReceived" or "OnMessage"]:Connect(LPH_JIT(function(message) 
  WebsocketKey = message;
end));

WS:Send(WebsocketId);
repeat wait() until WebsocketKey;

if CURRENT_EXPLOIT == IDENTIFIERS.SYNAPSEV3 then
  WS:Disconnect();
else
  WS:Close();
end;

--local CPU_Architecture = "2"; -- dumpstring(""):byte(9, 9) < 8 and "1" or "2"; -- 1 = 32Bit, 2 = 64Bit
local Response = LS_REQUEST({
  Method = "GET",
  Url = format(LPH_ENCSTR("http://localhost/auth/%s?%s=%s&%s=%s&%s=%s"), EndPoints[2], RandomWord(5), HWID, RandomWord(5), Key, RandomWord(5), RequestHash),
  Headers = {
    ["ornmprhyms"] = Fingerprint, 
    ["rnfkpggcvj"] = NumberId,
    ["thzlbitsim"] = ServerId,
    ["zafgzuyjyt"] = WebsocketKey,
    --["xabbmupvyq"] = Rot2(PCUsername or ""), -- literally just rot 2 rofl
    ["ennoczidjk"] = (tick() - TimeNow) .. "", -- Duratrion
    -- Fake Values (not needed)
    ["wkbzjadjkz"] = fakeSet, -- Fake NumberId
    ["slcrdmqaaf"] = RandomWord(10), -- fake fingerprint
    ["ftajbeeujx"] = ProjectID,
    ["yqkcgoegzy"] = ScriptIdentifier
  }
});

local LS_FASTEQ = LPH_JIT(function(a, b) return a == b end);

local WLSuccess;
--local cfRay = Response.Headers["CF-RAY"] or "";
--local cfReqId = Response.Headers["cf-request-id"] or ""; cf-request-id was removed ages ago see https://community.cloudflare.com/t/new-http-response-header-cf-request-id/165869

-- We can detect a simple jmp by setting a value in stack beforehand and then checking it in the main authentication frame
local JMPCounter = 0;

local JSONResponse = JSONDecode(Response.Body);
for _, v in pairs(JSONResponse) do
  if EQ(Type(v), "table") then
    fakeConcat();
    local WLMessage = HWID..Sub(EndPoints[2], LS_NUMENC(0), LS_NUMENC(2))..(NumberId*LS_NUMENC(2))..Fingerprint..Sub(EndPoints[1], LS_NUMENC(4), LS_NUMENC(5))..#ServerId..synUserId; -- concat go brr
    LS_OPCODESPAM("CONCAT")
    fakeConcat();
    local Message = v["0"];
    local recievedFingerprint = v["1"];
    local recievedId = v["2"];
    --local recievedFemIdentity = v[4];
    local recievedReqId = v["3"];
    --local recievedCPUArc = v[6];
    local recievedWebsocketKey = v["4"];
    local recievedProjectID = v["5"];
    local recievedRequestHash = v["6"];
    local recievedJSXToken = v["7"];
    local antiJMP = "";

    if not EQ(recievedRequestHash, RequestHash) then
      LPH_CRASH();
    end;

    if antiJMP then antiJMP = false; end;
    repeat until not antiJMP;
    
    if EQ(Message, WLMessage) then
      JMPCounter = JMPCounter + 1;
      if EQ(JSONResponse.error, false) then
        JMPCounter = JMPCounter + 1;
        if EQ(recievedFingerprint, Fingerprint) then
          JMPCounter = JMPCounter + 1;
          if EQ(recievedId, ScriptID) then
            JMPCounter = JMPCounter + 1;
            --if EQ(recievedFemIdentity, femmboyhubIdentity) then
            if EQ(recievedReqId, reqId) then
              JMPCounter = JMPCounter + 1;
              --if EQ(recievedCPUArc, CPU_Architecture) then
              if EQ(recievedWebsocketKey, HashString(WebsocketKey)) then
                if EQ(recievedProjectID, HashString(ProjectID)) then
                  JMPCounter = JMPCounter + 1;
                  exploitenv.LuaShield = false;
                
                  if antiJMP then antiJMP = false; end;
                  repeat until not antiJMP;
                  
                  if not StackReplay3 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if not StackReplay2 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if not EQ(HashString(StackReplay .. ""), HashStackReplay) then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if tick() - StackReplay > 30 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if JMPCounter ~= 6 then
                    LPH_CRASH();
                    while true do end;
                  end;
  
                  if JMPCounter > 6 then
                    LPH_CRASH()
                    while true do end;
                  end;
  
                  if JMPCounter < 6 then
                    LPH_CRASH()
                    while true do end;
                  end;

                  LS_OPCODESPAM("LT")
                  LS_OPCODESPAM("MOVE")
                  
                  LS_ScriptName = v["8"];
                  LS_ScriptVersion = v["9"];
                  LS_Exploit = v["10"];
                  LS_Executions = v["11"];
                  LS_CrackAttempts = v["12"];
                  LS_Username = v["13"];
                  LS_AccessToken = v["14"];

                  BackupPrint(format("LuaShield [%s]: Authenticated in %ss", LS_ScriptName, tick() - TimeNow));
                  WLSuccess = true; --UpdateGUI("Status", "Ready!", 354); wait(.25); --ScreenGui:Destroy();
                  
                  LS_OPCODESPAM("CALL");
                  (function(...) 
                    LS_OPCODESPAM("LT")
                    LS_OPCODESPAM("MOVE")
                    LS_OPCODESPAM("CALL")
                    do
                      local Word = RandomWord2();
                      if not EQ(Word, Word) then
                        LPH_CRASH();
                      end;
                    
                      if not StackReplay3 then
                        LPH_CRASH();
                      end;
                    
                      if not StackReplay2 then
                        LPH_CRASH();
                      end;
                    
                      if tick() - StackReplay > 30 then
                        LPH_CRASH();
                        while true do end;
                      end;
                      
                      LS_OPCODESPAM("CALL")

                      if JMPCounter ~= 6 then
                        LPH_CRASH();
                        while true do end;
                      end;
                    
                      if JMPCounter > 6 then
                        LPH_CRASH()
                        while true do end;
                      end;
                    
                      if JMPCounter < 6 then
                        LPH_CRASH()
                        while true do end;
                      end;

                      if not LS_FASTEQ("a", "a") then
                        LPH_CRASH();
                      end;

                      Response = nil;
                      JSONResponse = nil;
                      FingerprintJSON = nil;
                      Fingerprint = nil;
                      NumberId = nil;
                      reqId = nil;
                      PersonalKey = nil;
                      RequestHash = nil;
                      decodeString = nil;
                      LS_OPCODESPAM("CALL")
                      HashString = nil;
                      ScriptID = nil;
                      ServerId = nil;
                      WebsocketId = nil;
                      WLMessage = nil;
                      Message = nil;
                      recievedFingerprint = nil;
                      recievedId = nil;
                      recievedReqId = nil;
                      recievedWebsocketKey = nil;
                      recievedProjectID = nil;
                      recievedRequestHash = nil;
                    end;

                    coroutine.wrap(function() 
                      local Request = LS_REQUEST;
                      local DecodeJSON = JSONDecode;
                      JSONDecode = nil;
                      LS_REQUEST = request;

                      while wait(10) do
                        local Response = Request({
                          Method = "GET",
                          Url = "http://localhost/auth/v/" .. recievedJSXToken
                        });

                        if Response.StatusCode ~= 200 then
                          LPH_CRASH();
                        end;

                        if Response.Body == "" then
                          LPH_CRASH();
                        end;

                        local Data = DecodeJSON(Response.Body);
                        recievedJSXToken = Data.Token;
                      end;
                    end)();

                    --_SCRIPT_--
                  end)();
                  LS_OPCODESPAM("CALL");
                end;
              end;
            end;
          end;
        end;
      end;
    end;
  elseif EQ(_, LPH_ENCSTR("JSONHWID")) and not EQ(v, HWID) then
    CrashLog(LPH_ENCSTR("cb5wk0sauvs6"));
    LPH_CRASH();
    while true do end;
  end;
end;

if not WLSuccess then
  LPH_CRASH();
end;

coroutine.wrap(function() 
  while wait(5) do
    -- Forced security update
    if whitelistVersion ~= HttpGet("http://localhost/auth/version") then
      LPH_CRASH();
      while true do end;
    end;
  end;
end)();