const fullText = `scalars: $Extensions.GetPayloadResult<{
      id: number
      competitionId: number
      playerId: number
      status: string
      invitedBy: string | null
      invitedAt: Date | null
      joinedAt: Date | null
      leftAt: Date | null
    }, ExtArgs["result"]["competitionParticipant"]>`;

const payloadPattern = /\$Extensions\.GetPayloadResult<\s*\{([^}]+)\}/;
const match = payloadPattern.exec(fullText);

if (match?.[1]) {
  console.log("✅ MATCHED!");
  console.log("Content:", match[1]);
} else {
  console.log("❌ NO MATCH");
}
