import type { ChatInputCommandInteraction } from "discord.js";
import { z } from "zod";
import configuration from "../../../configuration.js";
import { prisma } from "../../../database/index.js";
import { getCompetitionById } from "../../../database/competition/queries.js";
import { createSnapshotsForAllParticipants } from "../../../league/competition/snapshots.js";

export async function executeDebugForceSnapshot(interaction: ChatInputCommandInteraction) {
  console.log("🐛 Executing debug force-snapshot command");

  // Verify bot owner
  if (interaction.user.id !== configuration.ownerDiscordId) {
    await interaction.reply({
      content: "❌ This command is restricted to the bot owner.",
      ephemeral: true,
    });
    return;
  }

  // Validate command options at boundary
  const ForceSnapshotOptionsSchema = z.object({
    competitionId: z.number().int().positive(),
    snapshotType: z.enum(["START", "END"]),
  });

  const rawCompetitionId = interaction.options.getInteger("competition-id", true);
  const rawSnapshotType = interaction.options.getString("type", true);

  const optionsResult = ForceSnapshotOptionsSchema.safeParse({
    competitionId: rawCompetitionId,
    snapshotType: rawSnapshotType,
  });

  if (!optionsResult.success) {
    await interaction.reply({
      content: `❌ Invalid command options: ${optionsResult.error.message}`,
      ephemeral: true,
    });
    return;
  }

  const { competitionId, snapshotType } = optionsResult.data;

  // Defer reply since this might take time
  await interaction.deferReply({ ephemeral: true });

  try {
    console.log(`🔍 Looking up competition ${competitionId.toString()}`);
    const competition = await getCompetitionById(prisma, competitionId);

    if (!competition) {
      await interaction.editReply(`❌ Competition ${competitionId.toString()} not found`);
      return;
    }

    console.log(`📸 Creating ${snapshotType} snapshots for competition "${competition.title}"`);

    // Force create snapshots for all participants
    await createSnapshotsForAllParticipants(prisma, competition.id, snapshotType, competition.criteria);

    await interaction.editReply(
      `✅ Created ${snapshotType} snapshots for all participants in competition **${competition.title}** (ID: ${competitionId.toString()})`,
    );

    console.log(`✅ Successfully created ${snapshotType} snapshots for competition ${competitionId.toString()}`);
  } catch (error) {
    console.error(`❌ Error creating snapshots for competition ${competitionId.toString()}:`, error);
    await interaction.editReply(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
